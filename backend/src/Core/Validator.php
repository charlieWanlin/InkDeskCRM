<?php

// Validation des champs obligatoires (erreur 422 si un champ manque).
class Validator
{
    public static function required($data, $champs)
    {
        $manquants = [];
        foreach ($champs as $champ) {
            if (!isset($data[$champ]) || $data[$champ] === '' || $data[$champ] === null) {
                $manquants[] = $champ;
            }
        }
        if ($manquants) {
            throw new HttpException('Champs obligatoires manquants : ' . implode(', ', $manquants), 422);
        }
    }
}
