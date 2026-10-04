import { jwtVerify, SignJWT } from "jose";

const secret=()=>{
  const value=process.env.JWT_SECRET;
  if(!value)throw new Error("JWT_SECRET is not configured");
  return new TextEncoder().encode(value);
};

export async function signAccessToken(subject:string,role:string){
  return new SignJWT({role,type:"access"})
    .setProtectedHeader({alg:"HS256"}).setSubject(subject).setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN||"15m").sign(secret());
}

export async function verifyAccessToken(token:string){
  const {payload}=await jwtVerify(token,secret());
  if(payload.type!=="access")throw new Error("Invalid access token");
  return payload;
}

export async function signRefreshToken(subject:string,role:string){
  return new SignJWT({role,type:"refresh"})
    .setProtectedHeader({alg:"HS256"}).setSubject(subject).setIssuedAt()
    .setExpirationTime(process.env.REFRESH_TOKEN_EXPIRES_IN||"30d").sign(secret());
}

export async function verifyRefreshToken(token:string){
  const {payload}=await jwtVerify(token,secret());
  if(payload.type!=="refresh")throw new Error("Invalid refresh token");
  return payload;
}
