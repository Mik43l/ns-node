require('dotenv').config()
const express = require('express')
const cors = require('cors');
const sdk = require('node-appwrite');

const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_API_ENDPOINT) // Your API Endpoint
    .setProject(process.env.APPWRITE_PROJECT_ID) // Your project ID
    .setKey(process.env.APPWRITE_API_KEY); // Your secret API key

const users = new sdk.Users(client);

const app = express()

// ✅ OR: Restrict to specific origin (recommended for production)
app.use(cors({
    origin: 'http://localhost:4200', // Angular dev server
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
