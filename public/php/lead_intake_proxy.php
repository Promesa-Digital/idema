<?php
declare(strict_types=1);

/**
 * lead_intake_proxy.php
 *
 * Proxy de ingesta de leads → CRM IDEMA (https://leads.idema.edu.pe).
 *
 * El SPA público (idema.edu.pe) hace POST aquí; este script agrega la
 * API key (que vive SOLO en el servidor, fuera de public_html) y reenvía
 * la petición al CRM.
 *
 * Se desplegó originalmente en /home/idemaedu/public_html/php/ vía el build
 * de Vite (public/php/ del repo se copia a dist/php/ y luego a public_html/php/).
 *
 * Configuración del servidor (una sola vez, NO en git):
 *   1) Crear el archivo /home/idemaedu/idema_secrets.php con:
 *      <?php
 *      return [
 *          'IDEMA_CRM_API_KEY' => 'la-key-real-aca',
 *      ];
 *   2) chmod 600 ese archivo (solo el dueño lo lee).
 *
 * Si cambia el asesor asignado, editar LEAD_ASESOR_USERNAME abajo y deployar.
 */

// ---------------- Config ----------------
const SECRETS_FILE         = '/home/idemaedu/idema_secrets.php';
const LEAD_ASESOR_USERNAME = 'geralhanari@gmail.com';
const CRM_ENDPOINT         = 'https://leads.idema.edu.pe/api/public/lead-intake';
const TIMEOUT_SECONDS      = 10;

// ---------------- Headers ----------------
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

// ---------------- Method ----------------
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'method_not_allowed']);
    exit;
}

// ---------------- Cargar secretos ----------------
$API_KEY = '';
if (is_file(SECRETS_FILE) && is_readable(SECRETS_FILE)) {
    $secrets = require SECRETS_FILE;
    if (is_array($secrets) && isset($secrets['IDEMA_CRM_API_KEY'])) {
        $API_KEY = (string) $secrets['IDEMA_CRM_API_KEY'];
    }
}
// Fallback: variable de entorno (por si más adelante se configura via cPanel/Apache)
if ($API_KEY === '') {
    $envKey = getenv('IDEMA_CRM_API_KEY');
    if ($envKey !== false) $API_KEY = $envKey;
}

if ($API_KEY === '' || $API_KEY === '__REPLACE_WITH_API_KEY__') {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'server_misconfigured',
        'detail'  => 'Falta IDEMA_CRM_API_KEY en ' . SECRETS_FILE,
    ]);
    exit;
}

// ---------------- Parse body ----------------
$raw   = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'invalid_json']);
    exit;
}

// Aceptar SOLO los campos que enviamos. asesorUsername se setea acá, NUNCA
// se acepta del cliente, para que el navegador no pueda redirigir leads.
$firstName = trim((string)($input['firstName'] ?? ''));
$lastName  = trim((string)($input['lastName']  ?? ''));
$phone     = preg_replace('/\D/', '', (string)($input['phone'] ?? '')) ?? '';
$email     = trim((string)($input['email']     ?? ''));
$form      = (int)($input['form'] ?? 0);
$message   = trim((string)($input['message']   ?? ''));

if ($firstName === '' || strlen($firstName) > 100 ||
    $lastName  === '' || strlen($lastName)  > 100 ||
    $email     === '' || strlen($email)     > 100 ||
    strlen($phone) !== 9 ||
    ($form !== 1 && $form !== 2)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'invalid_payload']);
    exit;
}

if (strlen($message) > 5000) {
    $message = substr($message, 0, 5000);
}

// ---------------- Forward to CRM ----------------
$payload = [
    'asesorUsername' => LEAD_ASESOR_USERNAME,
    'firstName'      => $firstName,
    'lastName'       => $lastName,
    'phone'          => $phone,
    'email'          => $email,
    'form'           => $form,
    'message'        => $message,
];

$ch = curl_init(CRM_ENDPOINT);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'X-WEBSITE-Key: ' . $API_KEY,
    ],
    CURLOPT_TIMEOUT        => TIMEOUT_SECONDS,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
]);

$response = curl_exec($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode === 0) {
    // 502 → el cliente sabe que es fallo de red al CRM y guarda el lead
    // en la cola de reintento local (localStorage).
    http_response_code(502);
    echo json_encode(['success' => false, 'error' => 'crm_unreachable', 'detail' => $curlErr]);
    exit;
}

// Pasar tal cual el status y body del CRM (201, 400, 401, 409, 500…)
http_response_code($httpCode);
echo $response;
