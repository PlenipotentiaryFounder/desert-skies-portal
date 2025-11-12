'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, Trash2, AlertCircle, Save, GripVertical } from 'lucide-react';
import type { RiskAssessmentCategory } from '@/lib/risk-assessment-service';

interface EditQuestionFormProps {
  question: any;
  categories: RiskAssessmentCategory[];
}

export function EditQuestionForm({ question, categories }: EditQuestionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Question state
  const [questionText, setQuestionText] = useState(question.question_text);
  const [categoryId, setCategoryId] = useState(question.category_id);
  const [questionType, setQuestionType] = useState(question.question_type);
  const [isDisqualifying, setIsDisqualifying] = useState(question.is_disqualifying);
  const [helpText, setHelpText] = useState(question.help_text || '');
  const [isActive, setIsActive] = useState(question.is_active);
  const [displayOrder, setDisplayOrder] = useState(question.display_order);

  // Answer options state (for multiple choice)
  const [answerOptions, setAnswerOptions] = useState(
    question.answer_options || []
  );

  // Numeric ranges state (for numeric questions)
  const [numericRanges, setNumericRanges] = useState(
    question.numeric_ranges || []
  );

  const handleAddAnswerOption = () => {
    setAnswerOptions([
      ...answerOptions,
      {
        id: `new-${Date.now()}`,
        question_id: question.id,
        answer_text: '',
        risk_score: 0,
        is_disqualifying: false,
        display_order: answerOptions.length
      }
    ]);
  };

  const handleRemoveAnswerOption = (index: number) => {
    setAnswerOptions(answerOptions.filter((_: any, i: number) => i !== index));
  };

  const handleUpdateAnswerOption = (index: number, field: string, value: any) => {
    const updated = [...answerOptions];
    updated[index] = { ...updated[index], [field]: value };
    setAnswerOptions(updated);
  };

  const handleAddNumericRange = () => {
    setNumericRanges([
      ...numericRanges,
      {
        id: `new-${Date.now()}`,
        question_id: question.id,
        min_value: null,
        max_value: null,
        risk_score: 0,
        is_disqualifying: false,
        range_label: '',
        display_order: numericRanges.length
      }
    ]);
  };

  const handleRemoveNumericRange = (index: number) => {
    setNumericRanges(numericRanges.filter((_: any, i: number) => i !== index));
  };

  const handleUpdateNumericRange = (index: number, field: string, value: any) => {
    const updated = [...numericRanges];
    updated[index] = { ...updated[index], [field]: value };
    setNumericRanges(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/risk-assessment/questions/${question.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: questionText,
          category_id: categoryId,
          question_type: questionType,
          is_disqualifying: isDisqualifying,
          help_text: helpText,
          is_active: isActive,
          display_order: displayOrder,
          answer_options: questionType === 'multiple_choice' ? answerOptions : undefined,
          numeric_ranges: questionType === 'numeric' ? numericRanges : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update question');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/risk-assessment-management');
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error('Error updating question:', err);
      setError(err instanceof Error ? err.message : 'Failed to update question');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Question updated successfully! Redirecting...
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Question Info */}
      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
          <CardDescription>Basic information about the question</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="questionText">Question Text *</Label>
            <Textarea
              id="questionText"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter the question..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionType">Question Type *</Label>
              <Select value={questionType} onValueChange={setQuestionType} required>
                <SelectTrigger id="questionType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="numeric">Numeric</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="helpText">Help Text (Optional)</Label>
            <Textarea
              id="helpText"
              value={helpText}
              onChange={(e) => setHelpText(e.target.value)}
              placeholder="Additional guidance for students..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value))}
              min={1}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="isDisqualifying">Can Disqualify</Label>
              <p className="text-xs text-muted-foreground">
                Question can have disqualifying answers
              </p>
            </div>
            <Switch
              id="isDisqualifying"
              checked={isDisqualifying}
              onCheckedChange={setIsDisqualifying}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Active</Label>
              <p className="text-xs text-muted-foreground">
                Show this question to students
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </CardContent>
      </Card>

      {/* Multiple Choice Answers */}
      {questionType === 'multiple_choice' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Answer Options</CardTitle>
                <CardDescription>Define the possible answers and their risk scores</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddAnswerOption}>
                <Plus className="h-4 w-4 mr-2" />
                Add Answer
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {answerOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No answer options yet. Click "Add Answer" to create one.
              </p>
            ) : (
              answerOptions.map((option: any, index: number) => (
                <div key={option.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Answer {index + 1}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAnswerOption(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Answer Text *</Label>
                    <Input
                      value={option.answer_text}
                      onChange={(e) => handleUpdateAnswerOption(index, 'answer_text', e.target.value)}
                      placeholder="Enter answer text..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Risk Score *</Label>
                      <Input
                        type="number"
                        value={option.risk_score}
                        onChange={(e) => handleUpdateAnswerOption(index, 'risk_score', parseInt(e.target.value))}
                        min={0}
                        max={10}
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-2 pt-7">
                      <Label htmlFor={`disqualifying-${index}`}>Auto NO-GO</Label>
                      <Switch
                        id={`disqualifying-${index}`}
                        checked={option.is_disqualifying}
                        onCheckedChange={(checked) => handleUpdateAnswerOption(index, 'is_disqualifying', checked)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Numeric Ranges */}
      {questionType === 'numeric' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Numeric Score Ranges</CardTitle>
                <CardDescription>Define value ranges and their risk scores</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddNumericRange}>
                <Plus className="h-4 w-4 mr-2" />
                Add Range
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {numericRanges.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No ranges defined yet. Click "Add Range" to create one.
              </p>
            ) : (
              numericRanges.map((range: any, index: number) => (
                <div key={range.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Range {index + 1}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveNumericRange(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Min Value</Label>
                      <Input
                        type="number"
                        value={range.min_value ?? ''}
                        onChange={(e) => handleUpdateNumericRange(index, 'min_value', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="Leave empty for -∞"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Max Value</Label>
                      <Input
                        type="number"
                        value={range.max_value ?? ''}
                        onChange={(e) => handleUpdateNumericRange(index, 'max_value', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="Leave empty for +∞"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Range Label (Optional)</Label>
                    <Input
                      value={range.range_label || ''}
                      onChange={(e) => handleUpdateNumericRange(index, 'range_label', e.target.value)}
                      placeholder="e.g., 'Normal', 'High', 'Danger'"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Risk Score *</Label>
                      <Input
                        type="number"
                        value={range.risk_score}
                        onChange={(e) => handleUpdateNumericRange(index, 'risk_score', parseInt(e.target.value))}
                        min={0}
                        max={10}
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-2 pt-7">
                      <Label htmlFor={`range-disqualifying-${index}`}>Auto NO-GO</Label>
                      <Switch
                        id={`range-disqualifying-${index}`}
                        checked={range.is_disqualifying}
                        onCheckedChange={(checked) => handleUpdateNumericRange(index, 'is_disqualifying', checked)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

