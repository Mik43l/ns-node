require('dotenv').config()
const express = require('express')
const cors = require('cors');
const sdk = require('node-appwrite');

const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_API_ENDPOINT) // Your API Endpoint
    .setProject(process.env.APPWRITE_PROJECT_ID) // Your project ID
    .setKey(process.env.APPWRITE_API_KEY); // Your secret API key

const users = new sdk.Users(client);
const databases = new sdk.Databases(client);
const messaging = new sdk.Messaging(client);

const app = express()

// ✅ OR: Restrict to specific origin (recommended for production)
app.use(cors({
    origin: process.env.APPWRITE_APP_ENDPOINT, // Angular dev server
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Appwrite-Project'],
    credentials: true
}));

const port = 3000

app.use(express.json());

app.post('/create-target', async (req, res) =>
{
    const { userId } = req.body;

    console.log("userId => " + userId)

    const { email } = await users.get(
        userId // userId
    );

    const targets = await users.listTargets(
        userId, // userId
        [] // queries (optional)
    );

    if (targets.total == 0)
    {
        const result = await users.createTarget(
            userId, // userId
            sdk.ID.unique(), // targetId
            sdk.MessagingProviderType.Email, // providerType
            email
        );

        res.json(result)
    } else res.json({ message: "Target alredy exists" })
})

app.post('/send-email', async (req, res) =>
{
    const { documentId, mode } = req.body
    const document = await databases.getDocument(
        process.env.APPWRITE_DATABASE_ID, // databaseId
        process.env.APPWRITE_COLLECTION_ID, // collectionId
        documentId
    );

    const subject = `Appuntamento - ${document.title} del ${new Date(document.start).toLocaleDateString('it-IT')}`

    const customerTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.4;">
    <p style="margin: 0; padding: 20px 0;">Gentile ${document.customerName ? document.customerName : 'cliente'},</p>
    <p style="margin: 0;">l'appuntamento in oggetto è stato ${mode === 'create' ? 'CREATO' : 'AGGIORNATO'}.</p>
    <p style="margin: 0;">👉 Lo stato dell'appuntamento è ${getStatus(document.status)}</p>
    <p style="margin: 0;">👉 Visualizza i nuovi dettagli sulla piattaforma</p>
    <p style="margin: 0; padding: 20px 0;">Grazie,<br>NS Installazioni Service</p>
</body>
</html>`;

    const NSTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.4;">
    <p style="margin: 0; padding: 20px 0;">Gentile NS Installazioni,</p>
    <p style="margin: 0;">l'appuntamento in oggetto è stato ${mode === 'create' ? 'CREATO' : 'AGGIORNATO'}.</p>
    <p style="margin: 0;">👉 Lo stato dell'appuntamento è ${getStatus(document.status)}</p>
    <p style="margin: 0;">👉 Visualizza i nuovi dettagli sulla piattaforma</p>
    <p style="margin: 0; padding: 20px 0;">Grazie,<br>NS Installazioni Service</p>
</body>
</html>`;

    // EMAIL CLIENTE
    await messaging.createEmail(
        sdk.ID.unique(), // messageId
        subject,
        customerTemplate,
        [],
        [document.customerId],
        [], [], [], [], false, true
    );

    // EMAIL FORNITORE  
    await messaging.createEmail(
        sdk.ID.unique(),
        subject,
        NSTemplate,
        [],
        [process.env.APPWRITE_ADMIN_ID],
        [], [], [], [], false, true
    );

    res.json({ success: true, sentTo: [document.customerEmail, process.env.APPWRITE_ADMIN_EMAIL] })
})

function getStatus(status)
{
    switch (status)
    {
        case "PENDING":
            return "IN ATTESA";
        case "APPROVED":
            return "APPROVATO";
        case "REJECTED":
            return "RIFIUTATO";
        case "CANCELLED":
            return "CANCELLATO";
        default:
            return "";
    }
}

app.post('/update-user-status', async (req, res) =>
{
    const { userId } = req.body;

    console.log("userId => " + userId)

    const { status } = await users.get(
        userId // userId
    );

    const newStatus = status ? false : true;

    const result = await users.updateStatus(
        userId, // userId
        newStatus // status
    );

    res.json(result)
})

app.get('/users', async (req, res) =>
{
    console.log('/users')
    res.json((await users.list([])));
})

app.get('/users/:id', async (req, res) =>
{
    const userId = req.params.id;
    res.json((await users.get(userId)));
})

app.get('/', async (req, res) =>
{
    res.json({ message: 'It works!' })
})

app.listen(port, () =>
{
    console.log(`Example app listening on port ${port}`)
})
