import { jwtVerify, SignJWT } from "jose";
import bcrypt from "bcryptjs";

const secret=()=>{const v=process.env.JWT_SECRET;if(!v)throw new Error("JWT_SECRET is not configured");return new TextEncoder().encode(v)};

export async function hashPassword(password:string){return bcrypt.hash(password,12)}
export async function verifyPassword(password:string,hash:string){return bcrypt.compare(password,hash)}
export async function signAccessToken(subject:string,role:string){return new SignJWT({role,type:"access"}).setProtectedHeader({alg:"HS256"}).setSubject(subject).setIssuedAt().setExpirationTime(process.env.JWT_EXPIRES_IN||"15m").sign(secret())}
export async function verifyAccessToken(token:string){const {payload}=await jwtVerify(token,secret());return payload}

export async function signOtpVerificationToken(phone:string,purpose:"booking"|"login"|"register"){
  return new SignJWT({phone,purpose,type:"otp_verified"}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("10m").sign(secret());
}

export async function verifyOtpVerificationToken(token:string){
  const {payload}=await jwtVerify(token,secret());
  if(payload.type!=="otp_verified"||typeof payload.phone!=="string"||typeof payload.purpose!=="string")throw new Error("Invalid OTP verification token");
  return payload;
}