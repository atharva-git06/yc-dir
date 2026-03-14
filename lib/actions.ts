"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { parseServerActionResponse } from "./utils";
import slugify from 'slugify'
import { writeClient } from "@/sanity/lib/write-client";

export const createPitch = async (state: any, form:FormData, pitch:string) => {
const session = await auth();
if(!session) return parseServerActionResponse({error: 'Not Signed in', status: 'ERROR'});
const {title,description,category,link} = Object.fromEntries(
    Array.from(form).filter(([key])=> key != 'pitch'),
);

const slug = slugify(title as string, {lower:true, strict:true})

try {
    const startup = {
        title,description,category,image:link,slug:{
            _type: slug,
            current: slug,
        },
        author: {
            _type: 'reference',
            _ref: session?.id
        },
        pitch
    }

    const result = await writeClient.create({_type:"startup",...startup});
    // Invalidate homepage cache so "All Startups" shows the new pitch on next load
    revalidatePath("/");
    return parseServerActionResponse({
        ...result,
        error: '',
        status: 'SUCCESS'
        
    })
    
} catch (error) {
    console.log(error);
    return parseServerActionResponse({
        error: JSON.stringify(error),
        status: 'ERROR',
    })
    
}

}


