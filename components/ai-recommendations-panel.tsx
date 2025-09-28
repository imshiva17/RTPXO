"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { AIRecommendation, Conflict } from "@/lib/types"
import { Brain, CheckCircle, X, Clock, AlertTriangle, TrendingUp, Info, Zap, Wrench, Users, Timer } from "lucide-react"

interface AIRecommendationsPanelProps {
  recommendations: AIRecommendation[]
  conflicts: Conflict[]
  onAcceptRecommendation: (recommendationId: string) => void
  onRejectRecommendation: (recommendationId: string) => void
  trains?: any[]
}

export function AIRecommendationsPanel({
  recommendations,
  conflicts,
  onAcceptRecommendation,
  onRejectRecommendation,
  trains = [],
}: AIRecommendationsPanelProps) {
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null)

  // Generate real-time AI recommendations based on actual conflicts
  const conflictBasedRecommendations = conflicts.map(conflict => {
    const trainNames = conflict.trains.map(id => {
      const train = trains.find(t => t.id === id)
      return train ? train.name : id
    })
    
    // Generate comprehensive AI recommendation based on conflict analysis
    const generateRecommendation = () => {
      const train1 = trains.find(t => t.id === conflict.trains[0])
      const train2 = trains.find(t => t.id === conflict.trains[1])
      const higherPriorityTrain = (train1?.priority || 0) >= (train2?.priority || 0) ? train1 : train2
      const lowerPriorityTrain = higherPriorityTrain === train1 ? train2 : train1
      
      const getJunctionName = () => {
        if (conflict.location === 'unknown') {
          return conflict.type === 'platform' ? 'Platform Junction' : 
                 conflict.type === 'crossing' ? 'Track Crossing Junction' : 'Signal Junction'
        }
        return conflict.location
      }
      
      if (conflict.severity === 'critical') {
        return {
          action: `IMMEDIATE HOLD: Stop ${lowerPriorityTrain?.name || trainNames[1]} at current signal`,
          reasoning: `SAFETY CRITICAL: Two trains approaching same track section. Railway Safety Rule 3.41 - No two trains shall occupy same block section simultaneously. ${higherPriorityTrain?.name} (Priority: ${higherPriorityTrain?.priority}) has right of way over ${lowerPriorityTrain?.name} (Priority: ${lowerPriorityTrain?.priority}).`,
          safetyRule: 'Block Section Occupancy Rule - Only one train per block section',
          priorityAnalysis: `${higherPriorityTrain?.name} (P${higherPriorityTrain?.priority}) > ${lowerPriorityTrain?.name} (P${lowerPriorityTrain?.priority})`,
          confidence: 0.95
        }
      } else if (conflict.severity === 'high') {
        return {
          action: `SPEED RESTRICTION: Reduce ${lowerPriorityTrain?.name || trainNames[1]} to 25 km/h and maintain 2km separation`,
          reasoning: `High risk ${conflict.type} conflict. Implementing speed control to ensure minimum safe separation distance. ${higherPriorityTrain?.name} maintains priority due to higher operational importance.`,
          safetyRule: 'Minimum Separation Distance - 2km between trains in same direction',
          priorityAnalysis: `Priority-based resolution: ${higherPriorityTrain?.name} proceeds, ${lowerPriorityTrain?.name} adjusts`,
          confidence: 0.88
        }
      } else {
        return {
          action: `CAUTION MONITORING: Both trains proceed with enhanced vigilance and ready-to-stop protocol`,
          reasoning: `Medium risk ${conflict.type}. Sufficient separation exists but requires continuous monitoring. Both trains can proceed with caution protocols activated.`,
          safetyRule: 'Vigilant Operation - Enhanced monitoring when trains in proximity',
          priorityAnalysis: `Both trains can proceed - separation distance adequate`,
          confidence: 0.82
        }
      }
    }
    
    const aiRec = generateRecommendation()
    
    return {
      id: `conflict-rec-${conflict.id}`,
      title: `${conflict.type.replace('_', ' ').toUpperCase()} at ${conflict.location}`,
      note: `Trains: ${trainNames.join(', ')} • Est. delay: ${conflict.estimatedDelay}min`,
      acceptReason: aiRec.reasoning,
      rejectReason: conflict.severity === 'critical' ? "Risk of collision if ignored" : "May cause minor delays to other trains",
      type: aiRec.action.includes('Hold') ? 'hold' : aiRec.action.includes('Reduce') ? 'proceed' : 'monitor',
      confidence: aiRec.confidence,
      icon: conflict.severity === 'critical' ? AlertTriangle : conflict.severity === 'high' ? Clock : CheckCircle,
      conflictData: {
        severity: conflict.severity,
        trains: trainNames,
        location: conflict.location,
        junctionName: conflict.location === 'unknown' ? 
          (conflict.type === 'platform' ? `${trainNames[0]?.split(' ')[0] || 'Main'} Platform` : 
           conflict.type === 'crossing' ? `${trainNames[0]?.split(' ')[0] || 'Main'} Crossing` : 
           `${trainNames[0]?.split(' ')[0] || 'Signal'} Junction`) : conflict.location,
        action: aiRec.action,
        conflictType: conflict.type,
        safetyRule: aiRec.safetyRule,
        priorityAnalysis: aiRec.priorityAnalysis
      }
    }
  })
  


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
      case "maintenance":
        return <Wrench className="h-4 w-4" />
      case "staffing":
        return <Users className="h-4 w-4" />
      case "optimization":
        return <Timer className="h-4 w-4" />
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
      case "maintenance":
        return "bg-destructive text-destructive-foreground"
      case "staffing":
        return "bg-chart-1 text-white"
      case "optimization":
        return "bg-accent text-accent-foreground"
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

  const allRecommendations = conflictBasedRecommendations

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Recommendations ({allRecommendations.length})
        </CardTitle>

        {allRecommendations.length === 0 && (
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
            {allRecommendations.map((recommendation) => {
              const isExpanded = expandedRecommendation === recommendation.id
              const IconComponent = recommendation.icon || Info
              const isConflictBased = recommendation.id.startsWith('conflict-rec-')

              return (
                <Card key={recommendation.id} className={`border-l-4 ${isConflictBased ? 'border-l-red-500' : 'border-l-primary'}`}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Recommendation Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getRecommendationTypeColor(recommendation.type)}>
                            <IconComponent className="h-3 w-3 mr-1" />
                            {recommendation.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {isConflictBased ? 'Live Conflict' : 'AI Suggested'}
                          </Badge>
                          {isConflictBased && recommendation.conflictData && (
                            <Badge variant={recommendation.conflictData.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                              {recommendation.conflictData.severity.toUpperCase()}
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
                        <p className="font-medium text-sm text-balance">{recommendation.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{recommendation.note}</p>
                        {isConflictBased && recommendation.conflictData && (
                          <div className="mt-2 space-y-3">
                            {/* Conflict Status */}
                            <div className={`p-3 rounded border-l-4 ${
                              recommendation.conflictData.severity === 'critical' ? 'bg-red-50 border-red-500' :
                              recommendation.conflictData.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                              'bg-yellow-50 border-yellow-500'
                            }`}>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <p><strong>🚨 Status:</strong> <span className={`font-bold ${
                                  recommendation.conflictData.severity === 'critical' ? 'text-red-700' :
                                  recommendation.conflictData.severity === 'high' ? 'text-orange-700' :
                                  'text-yellow-700'
                                }`}>{recommendation.conflictData.severity?.toUpperCase()} CONFLICT</span></p>
                                <p><strong>📍 Type:</strong> {recommendation.conflictData.conflictType?.replace('_', ' ').toUpperCase()}</p>
                                <p className="col-span-2"><strong>🗺️ Junction:</strong> {recommendation.conflictData.junctionName || recommendation.conflictData.location}</p>
                                <p className="col-span-2"><strong>🚂 Trains:</strong> {recommendation.conflictData.trains.join(' ⚡ ')}</p>
                              </div>
                            </div>
                            
                            {/* AI Recommendation */}
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                              <p className="text-xs mb-2"><strong>🤖 AI RECOMMENDATION:</strong></p>
                              <p className="text-sm font-medium text-blue-900 mb-2">{recommendation.conflictData.action}</p>
                            </div>
                            
                            {/* Safety Rule */}
                            <div className="p-3 bg-green-50 border border-green-200 rounded">
                              <p className="text-xs mb-1"><strong>⚖️ SAFETY RULE:</strong></p>
                              <p className="text-xs text-green-800">{recommendation.conflictData.safetyRule}</p>
                            </div>
                            
                            {/* Priority Analysis */}
                            <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                              <p className="text-xs mb-1"><strong>🎯 PRIORITY ANALYSIS:</strong></p>
                              <p className="text-xs text-purple-800">{recommendation.conflictData.priorityAnalysis}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="pt-3 border-t space-y-3">
                          <div>
                            <h4 className="font-medium text-sm mb-2 text-green-600">Reason to Accept:</h4>
                            <p className="text-sm text-muted-foreground text-balance">{recommendation.acceptReason}</p>
                          </div>

                          <div>
                            <h4 className="font-medium text-sm mb-2 text-red-600">Reason to Reject:</h4>
                            <p className="text-sm text-muted-foreground text-balance">{recommendation.rejectReason}</p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          className="flex-1" 
                          onClick={() => {
                            // Store decision for AI training
                            const decision = {
                              id: `decision_${Date.now()}`,
                              timestamp: new Date(),
                              recommendationId: recommendation.id,
                              recommendationType: recommendation.type,
                              recommendation: isConflictBased ? recommendation.conflictData?.action : recommendation.title,
                              reasoning: recommendation.acceptReason,
                              confidence: recommendation.confidence,
                              userAction: 'accepted',
                              contextData: {
                                conflictType: isConflictBased ? recommendation.conflictData?.conflictType : 'general',
                                severity: isConflictBased ? recommendation.conflictData?.severity : 'medium',
                                trains: isConflictBased ? recommendation.conflictData?.trains : [],
                                location: isConflictBased ? recommendation.conflictData?.location : 'unknown',
                                timeOfDay: new Date().toLocaleTimeString()
                              }
                            }
                            const existingData = JSON.parse(localStorage.getItem('ai-training-data') || '[]')
                            existingData.push(decision)
                            localStorage.setItem('ai-training-data', JSON.stringify(existingData))
                            onAcceptRecommendation(recommendation.id)
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept 
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => {
                            // Store rejection decision for AI training
                            const decision = {
                              id: `decision_${Date.now()}`,
                              timestamp: new Date(),
                              recommendationId: recommendation.id,
                              recommendationType: recommendation.type,
                              recommendation: isConflictBased ? recommendation.conflictData?.action : recommendation.title,
                              reasoning: recommendation.acceptReason,
                              confidence: recommendation.confidence,
                              userAction: 'rejected',
                              contextData: {
                                conflictType: isConflictBased ? recommendation.conflictData?.conflictType : 'general',
                                severity: isConflictBased ? recommendation.conflictData?.severity : 'medium',
                                trains: isConflictBased ? recommendation.conflictData?.trains : [],
                                location: isConflictBased ? recommendation.conflictData?.location : 'unknown',
                                timeOfDay: new Date().toLocaleTimeString()
                              }
                            }
                            const existingData = JSON.parse(localStorage.getItem('ai-training-data') || '[]')
                            existingData.push(decision)
                            localStorage.setItem('ai-training-data', JSON.stringify(existingData))
                            onRejectRecommendation(recommendation.id)
                          }}
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
