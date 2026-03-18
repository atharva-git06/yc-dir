import { auth } from "@/auth";
import SearchForm from "@/components/SearchForm";
import StartupCard, {StartupTypeCard} from "@/components/StartupCard";
import { clientFresh } from "@/sanity/lib/client";
import { SanityLive } from "@/sanity/lib/live";
import { STARTUPS_QUERY } from "@/sanity/lib/queries";

export default async function Home({searchParams} : {
  searchParams : Promise<{query?: string}>
  
}) {
  const query = (await searchParams).query;
  const searchTerm = query?.trim();
  const session = await auth();
  const params = {
    search: searchTerm ? `${searchTerm}*` : null,
    userId: session?.id ?? null,
  };


  // useCdn: false so when page re-renders after revalidatePath (new startup created), we get fresh list from API
  const posts = await clientFresh.fetch(STARTUPS_QUERY, params);


    return(
      <>
      <section className="pink_container">
      <h1 className="heading">
        Pitch Your Startup <br />Connect With Entrepreneurs
      </h1>

      <p className="sub-heading !max-w-3xl"> Submit Ideas, Vote on Pitches, and Get Noticed in Virtual Competitions.</p>

      <SearchForm query = {query}/>

      </section>

      <section className="section_container">

        <p className="text-30-semibold">
          {query ? `Search result for "${query}'` : 'All Startups'}

        </p>

        <ul className="mt-7 card_grid">          
             {
              posts.length > 0 ? (
                posts.map((post: StartupTypeCard, index:number) =>(
                  <StartupCard key = {post?._id} post={post}/>

                ))

              ):(
                     <p className="no-results">No startups found</p>
              )
             }

           

        </ul>

      </section>
      <SanityLive />
       
      </>
    
    )
  }