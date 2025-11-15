import { UserIcon } from 'lucide-react'
import { title } from 'process'
import {defineType,defineField} from "sanity"

export const playlist = defineType({
    name: "playlist",
    title: "playlist",
    type: "document",
    icon: UserIcon,
    fields: [
        defineField(
            {
                name: "title",
                type: "string"
            }
        ),
        defineField(
            {
                name: "slug",
                type: "slug",
                options : {
                    source: 'title' 
                }
            }
        ),
       
        defineField(
            {
                name: "select",
                type: "array",
                of: [{type:'reference', to: [{type:'startup'}]}]
                
            }
        ),
    ]
    }
)