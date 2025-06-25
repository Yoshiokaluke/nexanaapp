import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { fileName, fileType } = await request.json();

    const fileKey = `profile-images/${userId}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return NextResponse.json({ signedUrl, fileKey });
  } catch (error) {
    console.error("[UPLOAD_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 