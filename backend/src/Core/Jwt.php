<?php

/**
 * JWT minimal (HS256).
 * Format : base64url(header).base64url(payload).base64url(signature).
 * La signature HMAC-SHA256 garantit l'intégrité : sans la clé secrète, un jeton ne peut être forgé.
 */
class Jwt
{
    public static function encode(array $payload, string $secret): string
    {
        $header = self::b64(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $body = self::b64(json_encode($payload));
        $signature = self::sign("$header.$body", $secret);
        return "$header.$body.$signature";
    }

    // Vérifie + décode un jeton. Renvoie le payload, ou null si invalide/expiré.
    public static function decode(string $token, string $secret): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$header, $body, $signature] = $parts;

        // Comparaison en temps constant (anti-timing).
        if (!hash_equals(self::sign("$header.$body", $secret), $signature)) {
            return null;
        }

        $payload = json_decode(self::unb64($body), true);

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }
        return $payload;
    }
    // Génère la signature HMAC-SHA256 pour les données avec la clé secrète.
    private static function sign(string $data, string $secret): string
    {
        return self::b64(hash_hmac('sha256', $data, $secret, true));
    }
    // Encodage base64url. Remplace les caractères spéciaux et supprime les '=' de padding.
    private static function b64(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    // Décodage base64url. Remet les caractères spéciaux et décode.
    private static function unb64(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
