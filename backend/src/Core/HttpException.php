<?php

// Erreur applicative avec code HTTP, convertie en réponse JSON par le routeur.
class HttpException extends Exception
{
    private $status;

    // Constructeur avec message et code HTTP par défaut (400).
    // le _ veut dire que le paramètre est optionnel.
    public function __construct($message, $status = 400)
    {
        parent::__construct($message);
        $this->status = $status;
    }

    public function status()
    {
        return $this->status;
    }
}
