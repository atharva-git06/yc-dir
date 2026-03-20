"use client"
import React, { useActionState, useState } from 'react'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import MDEditor from '@uiw/react-md-editor'
import { Button } from './ui/button'
import { Send } from 'lucide-react'
import { formSchema } from '@/lib/validation'
import {z} from 'zod';
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { createPitch } from '@/lib/actions'

type FormActionState = { error: string; status: string; _id?: string }

const StartupForm = () => {
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [link, setLink] = useState("")
  const [pitch, setPitch] = useState("")
  const {toast} = useToast();
  const router = useRouter()

  const handleFormSubmit = async (prevState: FormActionState, formData: FormData) => {
    try {
        const file = formData.get("imageFile") as File | null
        const linkTrimmed = link.trim()
        const hasFile = file && file.size > 0
        const hasLink = linkTrimmed.length > 0

        if (!hasFile && !hasLink) {
            setErrors({ link: "Provide an image URL or upload an image" })
            toast({ title: "Error", description: "Add an image URL or upload an image", variant: "destructive" })
            return { ...prevState, error: "Image required", status: "ERROR" }
        }

        setErrors({})

        const formValues = {
            title,
            description,
            category,
            link: hasLink ? linkTrimmed : "",
            pitch,
        }
        await formSchema.parseAsync(formValues)
        const result = await createPitch(prevState, formData, pitch)
        if(result.status === "SUCCESS"){
            toast({
                title: 'Success',
                description: 'Your pitch has been created successfully'
            })
           
            router.push(`/startup/${result._id}`)
        }
        return result;
    } catch (error) {
        if(error instanceof z.ZodError){
            const fieldErrors = error.flatten().fieldErrors
            const next: Record<string, string> = {}
            for (const [key, messages] of Object.entries(fieldErrors)) {
              const first = messages?.[0]
              if (first) next[key] = first
            }
            setErrors(next)
            toast({
                title: "Error",
                description: "Please check your inputs and try again",
                variant: "destructive",

            })
            return {...prevState, error: 'Validation failed', status: 'ERROR'}
        }
        toast({
            title: "An unexpected error has occurred",
            description: "Please check your inputs and try again",
            variant: "destructive",

        })
        return {
            ...prevState,
            error: 'An unexpected error has occurred',
            status: "Error",
        }

        
    }
  };

  const [, formAction, isPending] = useActionState<FormActionState, FormData>(handleFormSubmit, {
    error: "",
    status: "INITIAL",
  })

  return (

    <form action={formAction} className='startup-form'>

        <div>
            <label htmlFor="title" className='startup-form_label'>
                      Title
            </label>
            <Input
              id='title'
              name='title'
              className='startup-form_input'
              required
              placeholder='Startup Title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <p className='startup-form_error'>{errors.title} </p>}
        </div>
        <div>
            <label htmlFor="description" className='startup-form_label'>
                      Description
            </label>
            <Textarea
              id='description'
              name='description'
              className='startup-form_textarea'
              required
              placeholder='Startup Description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {errors.description && <p className='startup-form_error'>{errors.description} </p>}
        </div>
        <div>
            <label htmlFor="category" className='startup-form_label'>
                      Category
            </label>
            <Input
              id='category'
              name='category'
              className='startup-form_input'
              required
              placeholder='Startup Category (Tech, Health, Education)'
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            {errors.category && <p className='startup-form_error'>{errors.category} </p>}
        </div>
        <div>
            <label htmlFor="link" className='startup-form_label'>
                      Image (URL or upload)
            </label>
            <Input
              id='link'
              name='link'
              className='startup-form_input'
              placeholder='Paste image URL (e.g. https://...)'
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <p className='text-14-normal text-black-300 mt-1 mb-2'>Or upload from your device:</p>
            <input
              type='file'
              name='imageFile'
              accept='image/*'
              className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90'
            />
            {errors.link && <p className='startup-form_error'>{errors.link} </p>}
        </div>
        <div data-color-mode="light">
            <label htmlFor="pitch" className='startup-form_label'>
                      Pitch
            </label>
            <MDEditor 
            value = {pitch}
            onChange = {(value) => setPitch(value as string)}
            id='pitch'
            preview='edit'
            height={300}
            style={{borderRadius:20, overflow:"hidden"}}
            textareaProps={{
                placeholder: "Briefly describe your idea and what problem it solves"
            }}
            previewOptions={{
                disallowedElements: ["style"]
            }}
            />
            {errors.pitch && <p className='startup-form_error'>{errors.pitch} </p>}
        </div>

        <Button type="submit" className='startup-form_btn text-white' disabled={isPending}>
            {isPending?"Submitting..." : "Submit Your Pitch"}
            <Send className="size-6 ml-2" />
               
        </Button>
    </form>
   
  )
}

export default StartupForm
