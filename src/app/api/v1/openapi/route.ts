import { NextResponse } from "next/server";

const document={
  openapi:"3.0.3",
  info:{
    title:"Dental Clinic API",
    version:"1.0.0",
    description:"API-first contract for the public website, admin CMS, booking and future mobile applications."
  },
  servers:[{url:(process.env.NEXT_PUBLIC_APP_URL||"http://localhost:3000")+"/api/v1"}],
  tags:[
    {name:"Health"},{name:"Auth"},{name:"Content"},{name:"Booking"},{name:"Payments"},{name:"Appointments"}
  ],
  paths:{
    "/health":{get:{tags:["Health"],responses:{"200":{description:"Service is healthy"}}}},
    "/services":{get:{tags:["Content"],responses:{"200":{description:"Published services"}}}},
    "/services/{slug}":{get:{tags:["Content"],parameters:[{name:"slug",in:"path",required:true,schema:{type:"string"}}],responses:{"200":{description:"Published service"}}}},
    "/doctors":{get:{tags:["Content"],responses:{"200":{description:"Published doctors"}}}},
    "/doctors/{slug}":{get:{tags:["Content"],parameters:[{name:"slug",in:"path",required:true,schema:{type:"string"}}],responses:{"200":{description:"Published doctor"}}}},
    "/blog":{get:{tags:["Content"],responses:{"200":{description:"Published blog posts"}}}},
    "/portfolio":{get:{tags:["Content"],responses:{"200":{description:"Published portfolio items"}}}},
    "/booking/availability":{get:{tags:["Booking"],parameters:[
      {name:"date",in:"query",required:true,schema:{type:"string",format:"date"}},
      {name:"serviceId",in:"query",required:true,schema:{type:"string"}}
    ],responses:{"200":{description:"Available slots"}}}},
    "/booking/request":{post:{tags:["Booking"],security:[],requestBody:{required:true,content:{"application/json":{schema:{$ref:"#/components/schemas/BookingRequest"}}}},responses:{"201":{description:"Appointment created"},"409":{description:"Slot conflict"}}}},
    "/auth/otp/request":{post:{tags:["Auth"],requestBody:{required:true,content:{"application/json":{schema:{$ref:"#/components/schemas/OtpRequest"}}}},responses:{"200":{description:"OTP requested"}}}},
    "/auth/otp/verify":{post:{tags:["Auth"],requestBody:{required:true,content:{"application/json":{schema:{$ref:"#/components/schemas/OtpVerify"}}}},responses:{"200":{description:"OTP verified"}}}},
    "/auth/otp/login":{post:{tags:["Auth"],requestBody:{required:true,content:{"application/json":{schema:{$ref:"#/components/schemas/OtpLogin"}}}},responses:{"200":{description:"Logged in"}}}},
    "/auth/refresh":{post:{tags:["Auth"],responses:{"200":{description:"Session refreshed"},"401":{description:"Invalid refresh token"}}}},
    "/appointments":{get:{tags:["Appointments"],responses:{"200":{description:"Current user's appointments or staff appointments"}}}},
    "/appointments/{id}":{delete:{tags:["Appointments"],parameters:[{name:"id",in:"path",required:true,schema:{type:"string"}}],responses:{"200":{description:"Appointment cancelled"}}}},
    "/payment/request":{post:{tags:["Payments"],requestBody:{required:true,content:{"application/json":{schema:{$ref:"#/components/schemas/PaymentRequest"}}}},responses:{"200":{description:"Payment checkout initialized"}}}}
  },
  components:{
    securitySchemes:{bearerAuth:{type:"http",scheme:"bearer",bearerFormat:"JWT"}},
    schemas:{
      LocalizedString:{type:"object",properties:{fa:{type:"string"},en:{type:"string"}}},
      LocalizedText:{type:"object",properties:{fa:{type:"string"},en:{type:"string"}}},
      OtpRequest:{type:"object",required:["phone"],properties:{phone:{type:"string"},purpose:{type:"string",enum:["booking","login","register"]}}},
      OtpVerify:{type:"object",required:["phone","code"],properties:{phone:{type:"string"},code:{type:"string",minLength:6,maxLength:6},purpose:{type:"string",enum:["booking","login","register"]}}},
      OtpLogin:{type:"object",required:["phone","verificationToken"],properties:{phone:{type:"string"},verificationToken:{type:"string"},name:{type:"string"}}},
      BookingRequest:{type:"object",required:["verificationToken","phone","name","serviceId","startsAt","endsAt"],properties:{
        verificationToken:{type:"string"},phone:{type:"string"},name:{type:"string"},serviceId:{type:"string"},
        startsAt:{type:"string",format:"date-time"},endsAt:{type:"string",format:"date-time"},customerNote:{type:"string"}
      }},
      PaymentRequest:{type:"object",required:["paymentId"],properties:{paymentId:{type:"string"}}}
    }
  }
};

export async function GET(){return NextResponse.json(document);}