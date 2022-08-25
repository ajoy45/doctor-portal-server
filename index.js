const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000



// middleware
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wf23jzl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
  try {
    await client.connect()
    const serviceCollection = client.db('doctor_portal').collection('services');
    const bookingCollection = client.db('doctor_portal').collection('booking');
    const userCollection = client.db('doctor_portal').collection('users');

    app.get('/service', async (req, res) => {
      const service = serviceCollection.find({})
      const result = await service.toArray()
      res.send(result)
    })
    // app.post('/login', (req, res) => {
    //   const email = req.body;
    //   // console.log(email)
    //   const token = jwt.sign(email, process.env.ACCES_TOKEN);
    //   // console.log(token)
    //   res.send({ token })

    // })

    app.put('/user/:email',async(req,res)=>{
      const email=req.params.email;
      const filter = {email:email};
      const user=req.body;
      
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(email, process.env.ACCES_TOKEN);
      res.send({result,token})
    })
    app.get('/users',async(req,res)=>{
      const users=await userCollection.find().toArray();
      res.send(users)
    })
    app.get('/booking',async(req,res)=>{
      const patient=req.query.patient;
      const tokenInfo=req.headers.authorization;
      // console.log(tokenInfo)
      const [bearer,accestoken]=tokenInfo.split(' ');
      // console.log(accestoken)
      const query={patient:patient};
      const decoded = jwt.verify(accestoken, process.env.ACCES_TOKEN);
      console.log(decoded)
      if(decoded){
        const booking=await bookingCollection.find(query).toArray();
        res.send(booking)
      }
    
    })
    app.post('/booking', async (req, res) => {
      const data = req.body;
      //  console.log(data)
      const query = { name: data.name, slot: data.slot, clientName: data.clientName, phone: data.phone, email: data.email, date: data.date };
      const exists = await bookingCollection.findOne(query);
      const tokenInfo = req.headers.authorization;
      //  console.log(tokenInfo)
      const [email, accesToken] = tokenInfo?.split(' ')
      const decoded = jwt.verify(accesToken, process.env.ACCES_TOKEN);
      // console.log(decoded)
      if (exists) {
        return res.send({ succces: false, booking: exists })
      }
      if (decoded === email) {
        const result = await bookingCollection.insertOne(data);
        res.send({ success: true, result })
      }

    })
    // 
    app.get('/available', async (req, res) => {
      const date = req.query.date;

      // step 1:  get all services
      const services = await serviceCollection.find().toArray();

      // step 2: get the booking of that day. output: [{}, {}, {}, {}, {}, {}]
      const query = { date: date };
      const bookings = await bookingCollection.find(query).toArray();

      // step 3: for each service
      services.forEach(service => {
        // step 4: find bookings for that service. output: [{}, {}, {}, {}]
        const serviceBookings = bookings.filter(book => book.treatment === service.name);
        // step 5: select slots for the service Bookings: ['', '', '', '']
        const bookedSlots = serviceBookings.map(book => book.slot);
        // step 6: select those slots that are not in bookedSlots
        const available = service.slots.filter(slot => !bookedSlots.includes(slot));
        //step 7: set available to slots to make it easier 
        service.slots = available;
      });


      res.send(services);
    })

  } finally {
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello doctors portal')
})

app.listen(port, () => {
  console.log(`dortors listening ${port}`)
})