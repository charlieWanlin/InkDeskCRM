<?php

// Table "studios" : identite du studio et reglages de facturation.
// Source du nom affiche dans l'interface et les documents.
class Studio
{
    // Studio du tenant, cree avec valeurs par defaut si absent.
    public static function forUser($userId)
    {
        $studio = Database::run('SELECT * FROM studios WHERE user_id = ?', [$userId])->fetch();
        if (!$studio) {
            Database::run('INSERT INTO studios (user_id, name) VALUES (?, ?)', [$userId, 'Mon studio']);
            $studio = Database::run('SELECT * FROM studios WHERE user_id = ?', [$userId])->fetch();
        }
        return $studio;
    }

    public static function update($userId, $data)
    {
        Validator::required($data, ['name']);
        self::forUser($userId); // Garantit l'existence de la ligne.

        Database::run(
            'UPDATE studios SET
                name = :name, subtitle = :subtitle, email = :email, phone = :phone,
                address = :address, siret = :siret, tva_mention = :tva_mention,
                quote_prefix = :quote_prefix, invoice_prefix = :invoice_prefix,
                payment_terms = :payment_terms, deposit_terms = :deposit_terms,
                notify_rdv = :notify_rdv, notify_invoices = :notify_invoices
             WHERE user_id = :user_id',
            [
                'name'            => $data['name'],
                'subtitle'        => isset($data['subtitle']) ? $data['subtitle'] : null,
                'email'           => isset($data['email']) ? $data['email'] : null,
                'phone'           => isset($data['phone']) ? $data['phone'] : null,
                'address'         => isset($data['address']) ? $data['address'] : null,
                'siret'           => isset($data['siret']) ? $data['siret'] : null,
                'tva_mention'     => isset($data['tva_mention']) ? $data['tva_mention'] : null,
                'quote_prefix'    => isset($data['quote_prefix']) ? $data['quote_prefix'] : 'DEV',
                'invoice_prefix'  => isset($data['invoice_prefix']) ? $data['invoice_prefix'] : 'FAC',
                'payment_terms'   => isset($data['payment_terms']) ? $data['payment_terms'] : null,
                'deposit_terms'   => isset($data['deposit_terms']) ? $data['deposit_terms'] : null,
                'notify_rdv'      => !empty($data['notify_rdv']) ? 1 : 0,
                'notify_invoices' => !empty($data['notify_invoices']) ? 1 : 0,
                'user_id'         => $userId,
            ]
        );

        return self::forUser($userId);
    }
}
