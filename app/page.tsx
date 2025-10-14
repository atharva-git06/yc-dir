import Hello from "./components/hello"

export default function Home() {
  console.log('whoami')
  return(
    <>
      <h1 className="text-3xl">
      welcome to nextjs
    </h1>
    <Hello />
    </>
  
  )
}