<?php
/**
 * noticias_proxy.php
 *
 * Proxy de noticias para el SPA de IDEMA (idema.edu.pe).
 * Lee el RSS de Drupal en https://website.instituto-idema.org/rss.xml,
 * lo transforma a JSON con los campos { title, excerpt, image, date, url }
 * y lo sirve con CORS y caché de 15 minutos en disco.
 *
 * Se desplegó originalmente en /home/idemaedu/public_html/php/ vía el build de Vite
 * (public/php/ del repo se copia a dist/php/ y luego a public_html/php/).
 */

declare(strict_types=1);

// ---- Headers ----------------------------------------------------------------
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: public, max-age=900');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---- Config -----------------------------------------------------------------
const RSS_URL         = 'https://website.instituto-idema.org/rss.xml';
const CACHE_TTL       = 900;   // 15 minutos
const MAX_ITEMS       = 12;
const EXCERPT_LEN     = 260;
const HTTP_TIMEOUT    = 8;
const CACHE_FILE      = __DIR__ . '/cache/noticias.json';
const CACHE_STALE_OK  = 86400; // 24h — sirve caché viejo si el origen falla

// ---- Helpers ----------------------------------------------------------------
function json_fail(int $code, string $msg, array $extra = []): void {
    http_response_code($code);
    echo json_encode(['error' => $msg] + $extra, JSON_UNESCAPED_UNICODE);
    exit;
}

function fetch_rss(string $url): ?string {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT        => HTTP_TIMEOUT,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_USERAGENT      => 'IDEMA-Proxy/1.0 (+https://idema.edu.pe)',
            CURLOPT_HTTPHEADER     => ['Accept: application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8'],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);
        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($body !== false && $code >= 200 && $code < 300) {
            return $body;
        }
    }
    // Fallback: file_get_contents
    $ctx = stream_context_create([
        'http' => [
            'timeout' => HTTP_TIMEOUT,
            'header'  => "User-Agent: IDEMA-Proxy/1.0\r\nAccept: application/rss+xml\r\n",
        ],
        'https' => [
            'timeout' => HTTP_TIMEOUT,
            'header'  => "User-Agent: IDEMA-Proxy/1.0\r\nAccept: application/rss+xml\r\n",
        ],
    ]);
    $body = @file_get_contents($url, false, $ctx);
    return $body !== false ? $body : null;
}

function clean_text(string $s): string {
    // Decodifica entidades HTML, tira etiquetas, compacta espacios.
    $s = html_entity_decode($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $s = strip_tags($s);
    $s = preg_replace('/\s+/u', ' ', $s) ?? '';
    return trim($s);
}

function first_image_from_html(string $html): ?string {
    // description viene con CDATA que lleva HTML ya escapado — pero simplexml lo devuelve sin escapar.
    if (preg_match('/<img[^>]+src=["\']([^"\']+)["\']/i', $html, $m)) {
        return $m[1];
    }
    return null;
}

/**
 * Extrae el cuerpo real de una noticia de Drupal desde el HTML del <description>.
 * Busca <div class="... field--name-body ..."> y devuelve su texto plano.
 * Si no lo encuentra, cae a un strip_tags global.
 */
function extract_body_text(string $html): string {
    // Intento 1: DOMDocument buscando field--name-body
    if ($html !== '' && class_exists('DOMDocument')) {
        $prev = libxml_use_internal_errors(true);
        $dom  = new DOMDocument();
        $wrap = '<?xml encoding="UTF-8"?><div>' . $html . '</div>';
        if (@$dom->loadHTML($wrap, LIBXML_NOWARNING | LIBXML_NOERROR)) {
            $xp = new DOMXPath($dom);
            $nodes = $xp->query("//div[contains(concat(' ', normalize-space(@class), ' '), ' field--name-body ')]");
            if ($nodes !== false && $nodes->length > 0) {
                $text = '';
                foreach ($nodes as $n) {
                    $text .= ' ' . $n->textContent;
                }
                libxml_clear_errors();
                libxml_use_internal_errors($prev);
                return clean_text($text);
            }
            // Intento 2: cualquier <p> (probablemente texto real)
            $ps = $xp->query('//p');
            if ($ps !== false && $ps->length > 0) {
                $text = '';
                foreach ($ps as $p) {
                    $text .= ' ' . $p->textContent;
                }
                $text = trim($text);
                if ($text !== '') {
                    libxml_clear_errors();
                    libxml_use_internal_errors($prev);
                    return clean_text($text);
                }
            }
        }
        libxml_clear_errors();
        libxml_use_internal_errors($prev);
    }
    // No hay cuerpo real en el feed — devolvemos vacío para que el caller use un placeholder.
    return '';
}

function cut_excerpt(string $text, int $len): string {
    if (mb_strlen($text, 'UTF-8') <= $len) {
        return $text;
    }
    $cut = mb_substr($text, 0, $len, 'UTF-8');
    $sp  = mb_strrpos($cut, ' ', 0, 'UTF-8');
    if ($sp !== false && $sp > $len - 40) {
        $cut = mb_substr($cut, 0, $sp, 'UTF-8');
    }
    return rtrim($cut, " \t\n\r\0\x0B.,;:") . '…';
}

function parse_rss(string $xml): array {
    libxml_use_internal_errors(true);
    $sx = simplexml_load_string($xml);
    if ($sx === false || !isset($sx->channel->item)) {
        return [];
    }
    $items = [];
    foreach ($sx->channel->item as $item) {
        $title       = clean_text((string) $item->title);
        $link        = trim((string) $item->link);
        $pubDate     = trim((string) $item->pubDate);
        $descHtml    = (string) $item->description;

        $image    = first_image_from_html($descHtml);
        $bodyText = extract_body_text($descHtml);
        $excerpt  = $bodyText !== ''
            ? cut_excerpt($bodyText, EXCERPT_LEN)
            : 'Lee la noticia completa en el blog institucional de IDEMA.';

        $dateIso = '';
        if ($pubDate !== '') {
            $ts = strtotime($pubDate);
            if ($ts !== false) $dateIso = date('Y-m-d', $ts);
        }

        if ($title === '' || $link === '') continue;

        $items[] = [
            'title'   => $title,
            'excerpt' => $excerpt,
            'image'   => $image ?: '',
            'date'    => $dateIso,
            'url'     => $link,
        ];
    }
    return array_slice($items, 0, MAX_ITEMS);
}

function read_cache(string $path, int $maxAge): ?string {
    if (!is_file($path)) return null;
    $age = time() - (int) @filemtime($path);
    if ($age > $maxAge) return null;
    $data = @file_get_contents($path);
    return $data !== false ? $data : null;
}

function write_cache(string $path, string $json): void {
    $dir = dirname($path);
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    $tmp = $path . '.tmp';
    if (@file_put_contents($tmp, $json, LOCK_EX) !== false) {
        @rename($tmp, $path);
    }
}

// ---- Main -------------------------------------------------------------------
$forceRefresh = isset($_GET['refresh']);

if (!$forceRefresh) {
    $fresh = read_cache(CACHE_FILE, CACHE_TTL);
    if ($fresh !== null) {
        header('X-Cache: HIT');
        echo $fresh;
        exit;
    }
}

$xml = fetch_rss(RSS_URL);

if ($xml === null) {
    // Intento servir caché viejo (hasta 24h) si el origen está caído.
    $stale = read_cache(CACHE_FILE, CACHE_STALE_OK);
    if ($stale !== null) {
        header('X-Cache: STALE');
        echo $stale;
        exit;
    }
    json_fail(502, 'No se pudo obtener el feed de noticias');
}

$items = parse_rss($xml);

if (count($items) === 0) {
    $stale = read_cache(CACHE_FILE, CACHE_STALE_OK);
    if ($stale !== null) {
        header('X-Cache: STALE-EMPTY');
        echo $stale;
        exit;
    }
    json_fail(502, 'Feed vacío o no parseable');
}

$json = json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($json === false) {
    json_fail(500, 'Error serializando JSON');
}

write_cache(CACHE_FILE, $json);
header('X-Cache: MISS');
echo $json;
