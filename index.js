const express = require('express')
const cors=require('cors')
const jwt = require('jsonwebtoken');
const app = express()
require('dotenv').config()
const port =process.env.PORT|| 5000

// user:doctor
// pass:7MqK6CqQzXKZcUql

// middleware
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wf23jzl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
  try {
     await client.connect()
     const serviceCollection=client.db('doctor_portal').collection('services');
     const bookingCollection=client.db('doctor_portal').collection('booking')

     app.get('/service',async(req,res)=>{
      const service=serviceCollection.find({})
      const result=await service.toArray()
      res.send(result)
     })
     app.post('/login',(req,res)=>{
        const email=req.body;
        // console.log(email)
        const token = jwt.sign(email, process.env.ACCES_TOKEN);
        // console.log(token)
        res.send({token})

     })
     app.post('/booking',async(req,res)=>{
       const data=req.body;
      //  console.log(data)
       const tokenInfo=req.headers.authorization;
      //  console.log(tokenInfo)
      const[email,accesToken]=tokenInfo.split(' ')
       var decoded = jwt.verify(accesToken, process.env.ACCES_TOKEN);
       if(decoded.email===email){
        const result = await bookingCollection.insertOne(data);
         res.send(result)
       }

      // 
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