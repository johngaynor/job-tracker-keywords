"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { employerService, jobService, keywordService } from "@/lib/db-services";
import { Employer, Industry } from "@/lib/database";
import { Plus, X, Star } from "lucide-react";

// Default keywords organized by category
const TECHNICAL_SKILLS = [
  "react",
  "javascript",
  "typescript",
  "node.js",
  "python",
  "java",
  "c#",
  "php",
  "html",
  "css",
  "sql",
  "mongodb",
  "postgresql",
  "mysql",
  "aws",
  "azure",
  "docker",
  "kubernetes",
  "git",
  "rest api",
  "graphql",
  "microservices",
  "ci/cd",
  "testing",
  "jest",
  "cypress",
  "selenium",
  "linux",
  "windows",
  "macos",
  "angular",
  "vue.js",
  "express.js",
  "spring",
  "django",
  "flask",
  "laravel",
  "ruby on rails",
  "golang",
  "rust",
  "swift",
  "kotlin",
  "flutter",
  "react native",
  "terraform",
  "jenkins",
];

const SOFT_SKILLS = [
  "communication",
  "teamwork",
  "leadership",
  "problem solving",
  "analytical thinking",
  "project management",
  "remote work",
  "collaboration",
  "mentoring",
  "training",
  "agile",
  "scrum",
  "adaptability",
  "creativity",
  "time management",
  "critical thinking",
  "decision making",
  "conflict resolution",
  "presentation skills",
  "customer service",
  "strategic planning",
  "multitasking",
  "attention to detail",
  "organizational skills",
];

const INDUSTRY_OPTIONS: Industry[] = [
  "Agriculture",
  "Biotech",
  "Consulting",
  "Cybersecurity",
  "Defense",
  "E-Commerce",
  "Education",
  "Energy",
  "Finance",
  "Gaming",
  "Government",
  "Healthcare",
  "Manufacturing",
  "Nonprofit",
  "Other",
  "Real Estate",
  "SaaS",
  "Telecommunications",
  "Transportation",
  "Travel",
];

interface AddJobFormProps {
  employers: Employer[];
  onJobAdded: () => void;
}

export function AddJobForm({ employers, onJobAdded }: AddJobFormProps) {
  const [selectedEmployer, setSelectedEmployer] = useState<string>("");
  const [newEmployerName, setNewEmployerName] = useState("");
  const [newEmployerNotes, setNewEmployerNotes] = useState("");
  const [newEmployerIndustry, setNewEmployerIndustry] = useState<
    Industry | undefined
  >(undefined);
  const [newEmployerFavorite, setNewEmployerFavorite] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jobNotes, setJobNotes] = useState("");
  const [jobLink, setJobLink] = useState("");
  const [jobReferenceNumber, setJobReferenceNumber] = useState("");
  const [jobSalaryEstimate, setJobSalaryEstimate] = useState("");
  const [jobInterestLevel, setJobInterestLevel] = useState<string>("");
  const [jobFavorite, setJobFavorite] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addKeyword = () => {
    if (
      newKeyword.trim() &&
      !keywords.includes(newKeyword.trim().toLowerCase())
    ) {
      setKeywords([...keywords, newKeyword.trim().toLowerCase()]);
      setNewKeyword("");
    }
  };

  const addDefaultKeyword = (keyword: string) => {
    if (!keywords.includes(keyword.toLowerCase())) {
      setKeywords([...keywords, keyword.toLowerCase()]);
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  // Filter keywords from both categories based on input and exclude already added keywords
  const filteredTechnicalSkills = TECHNICAL_SKILLS.filter(
    (keyword) =>
      keyword.toLowerCase().includes(newKeyword.toLowerCase()) &&
      !keywords.includes(keyword.toLowerCase())
  ).slice(0, 8); // Limit to 8 suggestions per category

  const filteredSoftSkills = SOFT_SKILLS.filter(
    (keyword) =>
      keyword.toLowerCase().includes(newKeyword.toLowerCase()) &&
      !keywords.includes(keyword.toLowerCase())
  ).slice(0, 8); // Limit to 8 suggestions per category

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || (!selectedEmployer && !newEmployerName.trim()))
      return;

    setIsSubmitting(true);
    try {
      let employerId: number;

      if (selectedEmployer === "new" && newEmployerName.trim()) {
        employerId = await employerService.create(
          newEmployerName.trim(),
          newEmployerNotes.trim() || undefined,
          newEmployerIndustry,
          newEmployerFavorite
        );
      } else if (selectedEmployer && selectedEmployer !== "new") {
        employerId = parseInt(selectedEmployer);
      } else {
        return;
      }

      const jobId = await jobService.create(
        employerId,
        jobTitle.trim(),
        jobNotes.trim() || undefined,
        jobLink.trim() || undefined,
        jobReferenceNumber.trim() || undefined,
        jobSalaryEstimate.trim() || undefined,
        jobInterestLevel ? parseInt(jobInterestLevel) : undefined,
        jobFavorite
      );

      // Add keywords
      for (const keyword of keywords) {
        await keywordService.create(jobId, keyword);
      }

      // Show success toast
      toast.success("Job application added successfully!", {
        description: `Added "${jobTitle}" at ${
          selectedEmployer === "new"
            ? newEmployerName
            : employers.find((e) => e.id === parseInt(selectedEmployer))?.name
        }`,
      });

      // Reset form
      setSelectedEmployer("");
      setNewEmployerName("");
      setNewEmployerNotes("");
      setNewEmployerIndustry(undefined);
      setNewEmployerFavorite(false);
      setJobTitle("");
      setJobNotes("");
      setJobLink("");
      setJobReferenceNumber("");
      setJobSalaryEstimate("");
      setJobInterestLevel("");
      setJobFavorite(false);
      setKeywords([]);
      setNewKeyword("");

      onJobAdded();
    } catch (error) {
      console.error("Error adding job:", error);
      toast.error("Failed to add job application", {
        description: "Please try again or check your input.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employer">Employer</Label>
            <Select
              value={selectedEmployer}
              onValueChange={setSelectedEmployer}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an employer or add new" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Add New Employer</SelectItem>
                {employers.map((employer) => (
                  <SelectItem key={employer.id} value={employer.id!.toString()}>
                    {employer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEmployer === "new" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newEmployer">New Employer Name</Label>
                  <Input
                    id="newEmployer"
                    value={newEmployerName}
                    onChange={(e) => setNewEmployerName(e.target.value)}
                    placeholder="Enter employer name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employerIndustry">Industry (optional)</Label>
                  <Select
                    value={newEmployerIndustry || ""}
                    onValueChange={(value) =>
                      setNewEmployerIndustry(value as Industry)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Favorite Employer?</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={newEmployerFavorite ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewEmployerFavorite(true)}
                      className="flex items-center gap-1"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          newEmployerFavorite ? "fill-current" : ""
                        }`}
                      />
                      Favorite
                    </Button>
                    <Button
                      type="button"
                      variant={!newEmployerFavorite ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewEmployerFavorite(false)}
                      className="flex items-center gap-1"
                    >
                      <Star className="h-4 w-4" />
                      Normal
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employerNotes">Employer Notes (optional)</Label>
                <Textarea
                  id="employerNotes"
                  value={newEmployerNotes}
                  onChange={(e) => setNewEmployerNotes(e.target.value)}
                  placeholder="Notes about this employer (culture, requirements, etc.)"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Row 1: Job Title, Job Link, Job Favorite */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Enter job title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobLink">Job Link (optional)</Label>
              <Input
                id="jobLink"
                type="url"
                value={jobLink}
                onChange={(e) => setJobLink(e.target.value)}
                placeholder="https://company.com/job-posting"
              />
            </div>
            <div className="space-y-2">
              <Label>Favorite Application?</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={jobFavorite ? "default" : "outline"}
                  size="sm"
                  onClick={() => setJobFavorite(true)}
                  className="flex items-center gap-1"
                >
                  <Star
                    className={`h-4 w-4 ${jobFavorite ? "fill-current" : ""}`}
                  />
                  Favorite
                </Button>
                <Button
                  type="button"
                  variant={!jobFavorite ? "default" : "outline"}
                  size="sm"
                  onClick={() => setJobFavorite(false)}
                  className="flex items-center gap-1"
                >
                  <Star className="h-4 w-4" />
                  Normal
                </Button>
              </div>
            </div>
          </div>

          {/* Row 2: Reference Number, Salary Estimate, Interest Level */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobReferenceNumber">
                Reference Number (optional)
              </Label>
              <Input
                id="jobReferenceNumber"
                value={jobReferenceNumber}
                onChange={(e) => setJobReferenceNumber(e.target.value)}
                placeholder="Job reference/code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobSalaryEstimate">
                Salary Estimate (optional)
              </Label>
              <Input
                id="jobSalaryEstimate"
                value={jobSalaryEstimate}
                onChange={(e) => setJobSalaryEstimate(e.target.value)}
                placeholder="e.g., $80,000 - $100,000, $120k/year"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobInterestLevel">Interest Level (1-10)</Label>
              <Select
                value={jobInterestLevel}
                onValueChange={setJobInterestLevel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interest level" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                    <SelectItem key={level} value={level.toString()}>
                      {level} {level <= 3 ? "🔴" : level <= 6 ? "🟡" : "🟢"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Job Notes textarea */}
          <div className="space-y-2">
            <Label htmlFor="jobNotes">Job Notes (optional)</Label>
            <Textarea
              id="jobNotes"
              value={jobNotes}
              onChange={(e) => setJobNotes(e.target.value)}
              placeholder="Notes about this specific job..."
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <Label>Keywords</Label>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left column: Input and default keywords */}
              <div className="space-y-4">
                {/* Add keyword form */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor="keyword" className="text-sm pb-2">
                      Keyword
                    </Label>
                    <Input
                      id="keyword"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Enter keyword or search suggestions"
                      onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addKeyword())
                      }
                    />
                  </div>
                  <Button type="button" onClick={addKeyword} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Keyword suggestions based on search */}
                {newKeyword.length > 0 &&
                  (filteredTechnicalSkills.length > 0 ||
                    filteredSoftSkills.length > 0) && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        Suggestions:
                      </Label>

                      {filteredTechnicalSkills.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            Technical Skills
                          </Label>
                          <div className="flex flex-wrap gap-1">
                            {filteredTechnicalSkills.map((keyword) => (
                              <Badge
                                key={keyword}
                                variant="outline"
                                className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800 transition-colors"
                                onClick={() => addDefaultKeyword(keyword)}
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {filteredSoftSkills.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-green-600 dark:text-green-400">
                            Soft Skills
                          </Label>
                          <div className="flex flex-wrap gap-1">
                            {filteredSoftSkills.map((keyword) => (
                              <Badge
                                key={keyword}
                                variant="outline"
                                className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800 transition-colors"
                                onClick={() => addDefaultKeyword(keyword)}
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {/* Show categorized keywords when no input */}
                {newKeyword.length === 0 && (
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Select from categories:
                    </Label>

                    {/* Technical Skills */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        Technical Skills
                      </Label>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {TECHNICAL_SKILLS.filter(
                          (keyword) => !keywords.includes(keyword.toLowerCase())
                        )
                          .slice(0, 15)
                          .map((keyword) => (
                            <Badge
                              key={keyword}
                              variant="outline"
                              className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800 transition-colors"
                              onClick={() => addDefaultKeyword(keyword)}
                            >
                              {keyword}
                            </Badge>
                          ))}
                      </div>
                    </div>

                    {/* Soft Skills */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-green-600 dark:text-green-400">
                        Soft Skills
                      </Label>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {SOFT_SKILLS.filter(
                          (keyword) => !keywords.includes(keyword.toLowerCase())
                        )
                          .slice(0, 15)
                          .map((keyword) => (
                            <Badge
                              key={keyword}
                              variant="outline"
                              className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800 transition-colors"
                              onClick={() => addDefaultKeyword(keyword)}
                            >
                              {keyword}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right column: Added keywords */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Added Keywords ({keywords.length}):
                </Label>
                {keywords.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {keywords.map((keyword, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800 rounded"
                      >
                        <span className="font-medium capitalize flex-1">
                          {keyword}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeKeyword(index)}
                          className="h-6 w-6"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-zinc-500 text-sm italic p-4 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg text-center">
                    No keywords added yet. Click suggestions or type your own.
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !jobTitle.trim() ||
              (!selectedEmployer && !newEmployerName.trim())
            }
            className="w-full"
            variant="outline"
          >
            {isSubmitting ? "Adding..." : "Add Job Application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
