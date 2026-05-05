<?php
declare(strict_types=1);

/**
 * Proxy de ingesta de leads → CRM IDEMA
 *
 * Este archivo se sube a https://idema.edu.pe/php/lead_intake_proxy.php
 * La página pública (idema.edu.pe) hace POST aquí desde el browser; este
 * script agrega la API key (que vive SOLO en el servidor) y reenvía al CRM.
 *
 * Configuración:
 *   1) Definir la env var IDEMA_CRM_API_KEY en el hosting (recomendado).
 *      Apache:  SetEnv IDEMA_CRM_API_KEY "<KEY>"  (en .htaccess o vhost)
 *   2) O bien, reemplazar el fallback de IDEMA_CRM_API_KEY abajo por la key
 *      real (NO COMMITEAR esa edición a git).
 *
 * Si cambia el asesor asignado, editar LEAD_ASESOR_USERNAME.
 */

// ---------------- Config ----------------
$API_KEY = getenv('IDEMA_CRM_API_KEY');
if ($API_KEY === false || $API_KEY === '') {
    // Fallback — reemplazar por la key real en deploy si no se usa env var.
    $API_KEY = '__REPLACE_WITH_API_KEY__';
}

const LEAD_ASESOR_USERNAME = 'geralhanari@gmail.com';
const CRM_ENDPOINT         = 'https://leads.idema.edu.pe/api/public/lead-intake';
const TIMEOUT_SECONDS      = 10;

// ---------------- Headers ----------------
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

// ---------------- Method ----------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'method_not_allowed']);
    exit;
}

// ---------------- API key sanity ----------------
if ($API_KEY === '__REPLACE_WITH_API_KEY__') {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'server_misconfigured']);
    exit;
}

// ---------------- Parse body ----------------
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'invalid_json']);
    exit;
}

// Aceptar SOLO los campos que enviamos. asesorUsername se setea acá, nunca
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
]);

$response = curl_exec($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode === 0) {
    // Devolvemos 502 para que el cliente sepa que es un fallo de red al CRM
    // (y guarde el lead en la cola de reintento local).
    http_response_code(502);
    echo json_encode(['success' => false, 'error' => 'crm_unreachable', 'detail' => $curlErr]);
    exit;
}

// Pasar tal cual el status y body del CRM (201, 400, 401, 409, 500…)
http_response_code($httpCode);
echo $response;
