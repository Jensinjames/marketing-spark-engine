import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Share2, FileText, PenTool, Megaphone, TrendingUp, Loader2 } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
const Generate = () => {
  const [selectedType, setSelectedType] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const contentTypes = [{
    id: "email",
    title: "Email Campaign",
    description: "Generate compelling email content",
    icon: Mail,
    credits: 15
  }, {
    id: "social",
    title: "Social Media Post",
    description: "Create engaging social media content",
    icon: Share2,
    credits: 5
  }, {
    id: "landing",
    title: "Landing Page Copy",
    description: "High-converting landing page content",
    icon: FileText,
    credits: 10
  }, {
    id: "blog",
    title: "Blog Post",
    description: "SEO-optimized blog content",
    icon: PenTool,
    credits: 8
  }, {
    id: "ad",
    title: "Ad Copy",
    description: "Persuasive advertising content",
    icon: Megaphone,
    credits: 6
  }, {
    id: "funnel",
    title: "Sales Funnel",
    description: "Complete funnel sequence",
    icon: TrendingUp,
    credits: 20
  }];
  const handleGenerate = async () => {
    if (!selectedType || !prompt.trim()) return;
    setIsGenerating(true);
    // Simulate generation process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
  };
  return <AuthGuard requireAuth={true}>
      <Layout>
        <div className="max-w-4xl mx-auto py-0">
          {/* Page Header */}
          <header className="mb-8">
            <h1 className="font-bold mb-3 text-gray-50 text-xl text-left my-0">
              Generate Content
            </h1>
            <p className="text-lg text-zinc-50">
              Create AI-powered marketing content in seconds
            </p>
          </header>

          {/* Content Type Selection */}
          <section aria-labelledby="content-types-heading" className="mb-8">
            <h2 id="content-types-heading" className="text-2xl font-semibold mb-6">
              Choose Content Type
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contentTypes.map(type => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return <button key={type.id} onClick={() => setSelectedType(type.id)} className={`
                      p-4 rounded-lg border-2 text-left transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                      ${isSelected ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'}
                    `} aria-pressed={isSelected} aria-describedby={`${type.id}-description`}>
                    <div className="flex items-start space-x-3">
                      <div className={`
                        p-2 rounded-lg
                        ${isSelected ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}
                      `}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate text-zinc-300">
                          {type.title}
                        </h3>
                        <p id={`${type.id}-description`} className="text-sm mt-1 text-zinc-100">
                          {type.description}
                        </p>
                        <span className="inline-block mt-2 text-xs font-medium text-purple-600">
                          {type.credits} credits
                        </span>
                      </div>
                    </div>
                  </button>;
            })}
            </div>
          </section>

          {/* Generation Form */}
          {selectedType && <section aria-labelledby="generation-form-heading">
              <Card>
                <CardHeader>
                  <CardTitle id="generation-form-heading">
                    Generate {contentTypes.find(t => t.id === selectedType)?.title}
                  </CardTitle>
                  <CardDescription>
                    Provide details about what you want to create
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={e => {
                e.preventDefault();
                handleGenerate();
              }} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="content-prompt" className="text-sm font-medium">
                        Describe your content requirements *
                      </Label>
                      <Textarea id="content-prompt" placeholder="Describe what you want to create, your target audience, key messages, tone of voice, etc." value={prompt} onChange={e => setPrompt(e.target.value)} className="min-h-[120px] resize-y" required aria-describedby="prompt-help" />
                      <p id="prompt-help" className="text-sm text-gray-500">
                        Be as specific as possible for better results. Include target audience, tone, key points, and any specific requirements.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tone-select">Tone of Voice</Label>
                        <Select>
                          <SelectTrigger id="tone-select">
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="humorous">Humorous</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="audience-input">Target Audience</Label>
                        <Input id="audience-input" placeholder="e.g., B2B decision makers, young professionals" />
                      </div>
                    </div>

                    <Button type="submit" className="w-full md:w-auto" disabled={!prompt.trim() || isGenerating} aria-describedby="generate-button-help">
                      {isGenerating ? <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          Generating...
                        </> : `Generate Content (${contentTypes.find(t => t.id === selectedType)?.credits} credits)`}
                    </Button>
                    <p id="generate-button-help" className="text-sm text-gray-500">
                      Generation typically takes 10-30 seconds
                    </p>
                  </form>
                </CardContent>
              </Card>
            </section>}
        </div>
      </Layout>
    </AuthGuard>;
};
export default Generate;