import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">shadcn/ui Template</h1>
          <ModeToggle />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Days Calculator</CardTitle>
              <CardDescription>Calculate merger control milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <p>A tool to calculate key merger control milestones based on filing date, accounting for business days only.</p>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/calculator">Open Calculator</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Card Title 2</CardTitle>
              <CardDescription>Card description goes here</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This is a simple card component from shadcn/ui.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Learn More</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Card Title 3</CardTitle>
              <CardDescription>Card description goes here</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This is a simple card component from shadcn/ui.</p>
            </CardContent>
            <CardFooter>
              <Button variant="secondary">Learn More</Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Button Variants</h2>
          <div className="flex flex-wrap gap-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>
      </div>
    </main>
  );
}
