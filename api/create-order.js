// File: api/create-order.js
// This is a complete Vercel Serverless Function for PayPal Hosted Fields

export default async function handler(req, res) {
    // Allow only POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get the amount from the request body
        const { amount } = req.body;
        
        if (!amount) {
            return res.status(400).json({ error: 'Amount is required' });
        }

        // PayPal API credentials (your Sandbox credentials)
        const PAYPAL_CLIENT_ID = "AZPJ5ocWFTkYatGx7Ay5JC7ctXMtbLXJ-ab8Jjpfy3J0vVY6zzCPfdSq1IX0c2Tvx17ZU5n82XnSaNJo";
        const PAYPAL_CLIENT_SECRET = "ECzIsk5Sbiw86lRUjOpk92LoGE6IbWf4qirbe0ufPaGE-0sfshR-kpcugmRp5RmIZ2ozJDlGVtbt4m68";
        
        // PayPal API base URL (sandbox)
        const PAYPAL_API = "https://api-m.sandbox.paypal.com";

        // 1. Get access token from PayPal
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
        
        const tokenResponse = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials'
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
            console.error('Token error:', tokenData);
            return res.status(500).json({ error: 'Failed to get PayPal token' });
        }

        const accessToken = tokenData.access_token;

        // 2. Create an order
        const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'PayPal-Request-Id': `order-${Date.now()}`
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        amount: {
                            currency_code: 'USD',
                            value: amount.toString()
                        }
                    }
                ]
            })
        });

        const orderData = await orderResponse.json();

        if (!orderResponse.ok) {
            console.error('Order creation error:', orderData);
            return res.status(500).json({ error: 'Failed to create PayPal order' });
        }

        // 3. Return the order ID to the frontend
        return res.status(200).json({ id: orderData.id });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
