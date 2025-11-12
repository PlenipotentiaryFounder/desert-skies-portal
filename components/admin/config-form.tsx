'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Save, Info } from 'lucide-react';
import type { RiskAssessmentConfig } from '@/lib/risk-assessment-service';

interface ConfigFormProps {
  config: RiskAssessmentConfig;
}

export function ConfigForm({ config }: ConfigFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(config.name);
  const [description, setDescription] = useState(config.description || '');
  const [maxAllowedScore, setMaxAllowedScore] = useState(config.max_allowed_score);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/risk-assessment/config/${config.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          max_allowed_score: maxAllowedScore
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update configuration');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/risk-assessment-management');
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error('Error updating configuration:', err);
      setError(err instanceof Error ? err.message : 'Failed to update configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate threshold recommendations
  const cautionThreshold = Math.floor(maxAllowedScore * 0.75);

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
            Configuration updated successfully! Redirecting...
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuration Details</CardTitle>
          <CardDescription>System-wide risk assessment settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Configuration Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Pre-Flight Risk Assessment"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description of this configuration..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxScore">Maximum Allowed Score *</Label>
            <Input
              id="maxScore"
              type="number"
              value={maxAllowedScore}
              onChange={(e) => setMaxAllowedScore(parseInt(e.target.value))}
              min={1}
              max={100}
              required
            />
            <p className="text-xs text-muted-foreground">
              Students with a score at or below this value can fly (if no disqualifying conditions)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Scoring Thresholds
          </CardTitle>
          <CardDescription>How scores are interpreted with current settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg">
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">GO</p>
                <p className="text-sm text-muted-foreground">Safe to fly</p>
              </div>
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                0 - {cautionThreshold - 1}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg">
              <div>
                <p className="font-medium text-yellow-700 dark:text-yellow-400">CAUTION</p>
                <p className="text-sm text-muted-foreground">Approaching limit, review carefully</p>
              </div>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                {cautionThreshold} - {maxAllowedScore}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">NO-GO</p>
                <p className="text-sm text-muted-foreground">Do not fly</p>
              </div>
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {maxAllowedScore + 1}+
              </p>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Note:</strong> Any disqualifying condition automatically results in NO-GO,
                regardless of the total score.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

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
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </form>
  );
}

