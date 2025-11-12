import { EnhancedSyllabus } from "@/lib/enhanced-syllabus-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Book,
  Scale
} from "lucide-react"

interface SyllabusOverviewTabProps {
  syllabus: EnhancedSyllabus
}

export function SyllabusOverviewTab({ syllabus }: SyllabusOverviewTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* ACS Document Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            ACS Document
          </CardTitle>
          <CardDescription>
            Airman Certification Standards alignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {syllabus.acs_document ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Title</p>
                <p className="font-medium">{syllabus.acs_document.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Certificate Type</p>
                <Badge variant="outline" className="mt-1">
                  {formatCertificateType(syllabus.acs_document.certificate_type)}
                </Badge>
              </div>
              {syllabus.acs_document.faa_document_number && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Document Number</p>
                  <p className="text-sm">{syllabus.acs_document.faa_document_number}</p>
                </div>
              )}
              {syllabus.acs_document.version && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Version</p>
                  <p className="text-sm">{syllabus.acs_document.version}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">No ACS document linked</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAR References Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-blue-600" />
            FAR References
          </CardTitle>
          <CardDescription>
            Federal Aviation Regulations covered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {syllabus.far_references && syllabus.far_references.length > 0 ? (
            <div className="space-y-4">
              {syllabus.far_references.map((ref, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      FAR Part {ref.part}
                    </Badge>
                    {ref.subpart && (
                      <Badge variant="secondary" className="font-mono text-xs">
                        Subpart {ref.subpart}
                      </Badge>
                    )}
                  </div>
                  {ref.sections && ref.sections.length > 0 && (
                    <div className="ml-4 flex flex-wrap gap-1">
                      {ref.sections.map((section, idx) => (
                        <span 
                          key={idx}
                          className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded"
                        >
                          §{section}
                        </span>
                      ))}
                    </div>
                  )}
                  {ref.description && (
                    <p className="text-sm text-muted-foreground ml-4">
                      {ref.description}
                    </p>
                  )}
                  {index < syllabus.far_references.length - 1 && (
                    <Separator className="mt-3" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">No FAR references specified</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Experience Requirements Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            Experience Requirements
          </CardTitle>
          <CardDescription>
            Required flight hours and experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          {syllabus.experience_requirements && Object.keys(syllabus.experience_requirements).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(syllabus.experience_requirements).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="font-medium">
                    {value} {typeof value === 'number' ? 'hours' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">No experience requirements defined</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Knowledge Requirements Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5 text-orange-600" />
            Knowledge Requirements
          </CardTitle>
          <CardDescription>
            Knowledge test areas and requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {syllabus.knowledge_requirements && syllabus.knowledge_requirements.length > 0 ? (
            <div className="space-y-3">
              {syllabus.knowledge_requirements.map((req, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{req.area}</p>
                    {req.minimum_score && (
                      <Badge variant="outline" className="text-xs">
                        Min: {req.minimum_score}%
                      </Badge>
                    )}
                  </div>
                  {req.topics && req.topics.length > 0 && (
                    <ul className="ml-4 space-y-0.5">
                      {req.topics.map((topic, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground">
                          • {topic}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">No knowledge requirements defined</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatCertificateType(type: string): string {
  const formats: Record<string, string> = {
    'private': 'Private Pilot',
    'instrument': 'Instrument Rating',
    'commercial': 'Commercial Pilot',
    'cfi': 'Flight Instructor',
    'multi': 'Multi-Engine',
    'atp': 'ATP'
  }
  return formats[type] || type
}

