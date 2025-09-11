"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { AIRecommendation, Conflict } from "@/lib/types"
import { Brain, CheckCircle, X, Clock, AlertTriangle, TrendingUp, Info, Zap } from "lucide-react"

interface AIRecommendationsPanelProps {
  recommendations: AIRecommendation[]
  conflicts: Conflict[]
  onAcceptRecommendation: (recommendationId: string) => void
  onRejectRecommendation: (recommendationId: string) => void
}

export function AIRecommendationsPanel({
  recommendations,
  conflicts,
  onAcceptRecommendation,
  onRejectRecommendation,
}: AIRecommendationsPanelProps) {
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null)

  const getRecommendationTypeIcon = (type: string) => {
    switch (type) {
      case "hold":
        return <Clock className="h-4 w-4" />
      case "proceed":
        return <CheckCircle className="h-4 w-4" />
      case "reroute":
        return <TrendingUp className="h-4 w-4" />
      case "priority_change":
        return <Zap className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getRecommendationTypeColor = (type: string) => {
    switch (type) {
      case "hold":
        return "bg-chart-3 text-white"
      case "proceed":
        return "bg-primary text-primary-foreground"
      case "reroute":
        return "bg-chart-2 text-white"
      case "priority_change":
        return "bg-chart-5 text-white"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-primary"
    if (confidence >= 0.6) return "text-chart-3"
    return "text-muted-foreground"
  }

  const getConflictForRecommendation = (recommendationId: string) => {
    const recommendation = recommendations.find((r) => r.id === recommendationId)
    return recommendation ? conflicts.find((c) => c.id === recommendation.conflictId) : null
  }

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Recommendations ({recommendations.length})
        </CardTitle>

        {recommendations.length === 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              No active recommendations. All conflicts resolved or no conflicts detected.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {recommendations.map((recommendation) => {
              const conflict = getConflictForRecommendation(recommendation.id)
              const isExpanded = expandedRecommendation === recommendation.id

              return (
                <Card key={recommendation.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Recommendation Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getRecommendationTypeColor(recommendation.type)}>
                            {getRecommendationTypeIcon(recommendation.type)}
                            {recommendation.type.replace("_", " ")}
                          </Badge>
                          {conflict && (
                            <Badge variant="outline" className="text-xs">
                              {conflict.severity} conflict
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${getConfidenceColor(recommendation.confidence)}`}>
                            {Math.round(recommendation.confidence * 100)}%
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedRecommendation(isExpanded ? null : recommendation.id)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Action Description */}
                      <div>
                        <p className="font-medium text-sm text-balance">{recommendation.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">Target: Train {recommendation.targetTrain}</p>
                      </div>

                      {/* Impact Summary */}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-primary" />
                          <span className="text-muted-foreground">
                            Reduces delay by {recommendation.estimatedImpact.delayReduction}m
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-chart-3" />
                          <span className="text-muted-foreground">
                            Affects {recommendation.estimatedImpact.affectedTrains.length} trains
                          </span>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="pt-3 border-t space-y-3">
                          <div>
                            <h4 className="font-medium text-sm mb-2">AI Reasoning:</h4>
                            <p className="text-sm text-muted-foreground text-balance">{recommendation.reasoning}</p>
                          </div>

                          {conflict && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">Conflict Details:</h4>
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Type:</span>
                                  <span>{conflict.type}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Location:</span>
                                  <span>{conflict.location}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Estimated Delay:</span>
                                  <span>{conflict.estimatedDelay}m</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Involved Trains:</span>
                                  <span>{conflict.trains.join(", ")}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div>
                            <h4 className="font-medium text-sm mb-2">Expected Impact:</h4>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Delay Reduction:</span>
                                <span className="text-primary font-medium">
                                  -{recommendation.estimatedImpact.delayReduction} minutes
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Affected Trains:</span>
                                <span>{recommendation.estimatedImpact.affectedTrains.join(", ")}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1" onClick={() => onAcceptRecommendation(recommendation.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => onRejectRecommendation(recommendation.id)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </div>
  )
}
