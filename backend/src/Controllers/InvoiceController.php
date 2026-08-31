<?php

// Factures (multi-tenant) : CRUD REST et génération depuis un devis.
class InvoiceController
{
    public static function index()
    {
        return Invoice::all(
            Auth::userId(),
            Request::query('search'),
            Request::query('status'),
            Request::query('sort')
        );
    }

    public static function show($id)
    {
        return self::or404(Auth::userId(), $id);
    }

    public static function store()
    {
        return Invoice::create(Auth::userId(), Request::body());
    }

    // POST /invoices/from-quote/{quoteId}
    public static function fromQuote($quoteId)
    {
        return Invoice::fromQuote(Auth::userId(), $quoteId);
    }

    public static function update($id)
    {
        $userId = Auth::userId();
        self::or404($userId, $id);
        return Invoice::update($userId, $id, Request::body());
    }

    public static function destroy($id)
    {
        Invoice::delete(Auth::userId(), $id);
        return ['deleted' => true];
    }

    private static function or404($userId, $id)
    {
        $invoice = Invoice::find($userId, $id);
        if (!$invoice) {
            throw new HttpException('Facture introuvable', 404);
        }
        return $invoice;
    }
}
