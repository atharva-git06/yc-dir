import Navbar from "@/components/Navbar";
import JarvisWidget from "@/components/JarvisWidget";

export default function Layout({children}: Readonly<{children: React.ReactNode}>){
    return(
        <main className="font-work-sans">
            <Navbar/>

            {children}
            <JarvisWidget />
        </main>
    )
}