require('dotenv').config()
const express = require('express')
const cors = require("cors");
const AWS = require('aws-sdk')
const bodyParser = require('body-parser')

// const AWS =require('aws-sdk/lib/maintenance_mode_message').suppress = true;
// const { S3Client }  = require("@aws-sdk/client-s3")
const multer = require('multer')
const multerS3 = require('multer-s3')

const app = express();
app.use(bodyParser.json());
app.use(cors());

// console.log(process.env.AWS_SECRET_KEY)

AWS.config.update({
    secretAccessKey:process.env.AWS_SECRET_KEY,
    accessKeyId:process.env.AWS_ACCESS_KEY,
    region:process.env.REGION
})

const BUCKET = process.env.BUCKET_NAME
const s3 = new AWS.S3()


// s3.listBuckets((err,data)=>{
//     if(err){
//         console.log(err)
//     }
//     else{
//         console.log(data.Buckets)
//     }
// })
// const upload = multer({
//     storage:multerS3({
//         bucket:BUCKET,
//         s3,
//         body:'Hello',
//         acl:'public',
//         key:(req,file,callback) => {
//             // console.log(req)
//             // console.log(file)
//             callback(null,file.originalname)
//         }   
//     })
// })
const  storage = multer.memoryStorage({
    destination:(req,file,callback)=>{
        callback(null,'')
    }
})
const upload = multer({storage}).single('file')
// const upload = multer({ dest: './public/data/uploads/' })   
// console.log(upload.single())
app.listen(8080, function () {
    console.log('Example app listening on port 8080!');
});


app.post('/upload',upload,(req,res)=>{
    // console.log(req.file)
    // res.send({
    //     message:"hello"
    // })
    let myFile = req.file.originalname.split("")
    // const fileType = myFile[myFile.length -1]
    const fileType = req.file.originalname
    // console.log(fileType)
    const params ={
        Bucket:BUCKET,
        Key:`${fileType}`,
        Body:req.file.buffer
    }

    
    s3.upload(params,(err,data)=>{
        if(err)
        {
            return res.send(err)
        }
        else{
            return res.send(data)
        }
    })
    // console.log(req.file)
    // res.send(req);
    // res.send('File succefully uploaded ' + req.file.location + 'location')
})

app.get('/list', async (req,res)=>{
    let data = await s3.listObjectsV2({Bucket:BUCKET}).promise();
    let path = data.Contents.map(item=>item.Key);
    res.send(path)
})

app.get('/download/:filename',async (req,res)=>{
    const filename = req.params.filename
    let file =await s3.getObject({Bucket:BUCKET,Key:filename}).promise();
    res.send(file.Body)
})

app.get('/delete/:filename',async(req,res)=>{
    const filename = req.params.filename
    let file = await s3.deleteObject({Bucket:BUCKET,Key:filename}).promise()
    res.send('File deleted successfully')
})

