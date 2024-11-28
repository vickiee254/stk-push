const express=require("express")
const bodyParser=require("body-parser");
const app=express();
require('dotenv').config();
const passkey=process.env.MPESA_PASSKEY;
const consumerKey=process.env.CUSTOMER_KEY;
const consumerSecret=process.env.CUSTOMER_SECRET;
const port =process.env.PORT || 4000;
const axios=require('axios');
const unirest=require("unirest");
const request=require("request");
const { getTimestamp, getPassword } = require("./Utils");
const { response } = require("express");
app.use(bodyParser.json());
let OrderID;


app.listen(port,(err,live)=>{
    if(err){
        console.error(err)
    }
    console.log(`Server is Running ${port}`)
})
function access(req,res,next){
    const url='https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    const auth='Basic ' + Buffer.from(consumerKey+':'+consumerSecret).toString('base64');
    const headers={
        Authorization: auth,
    };  
    axios.get(url,{
        headers:headers,
    }).then((response)=>{
        let data =response.data;
        req.accessToken=data.access_token;
        // console.log(req.accessToken);
        next();
    }).catch((error)=>console.log(error))
}
app.get("/accessToken",access,(req,res)=>{
    res.status(200).json({accessToken:req.accessToken})
})
app.post("/stk/push",access,(req,res)=>{
    const stkUrl='https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    let amount_payable=req.query.amount;
    let paybill=174379;
    let account_reference="VICTOR IRERI CODEX LTD";
    let phoneNumber=req.query.phoneNumber;
    OrderID=req.query.orderID;
    let headerToken=`Bearer ${req.accessToken}`;
    let timestamp=getTimestamp();
    let password=getPassword(paybill,passkey,timestamp);
    let data={
        "BusinessShortCode":paybill,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount_payable,
        "PartyA": phoneNumber,
        "PartyB": paybill,
        "PhoneNumber": phoneNumber,
        "CallBackURL": "https://c52e-41-89-227-170.eu.ngrok.io/CallBack",
        "AccountReference": account_reference,
        "TransactionDesc": "VICTOR LTD" 
    };
    axios
    .post(stkUrl,data,{headers:{Authorization:headerToken,},})
    .then((response)=>res.send(response.data))
    .catch((error)=>{console.log(error)});
})
app.post("/CallBack",(req,res)=>{
     try{
        const db=getDatabase(firebase_app);

        const updates={};
        updates['/PaymentStatus']="Paid";

        update(ref(db,`Orders/Order state/${OrderID}`),updates);
        return res.status(200).json(message);

    }catch(err){
        console.log(err);
        return res.json({
            RespMessage:err.message
        })
    }
})