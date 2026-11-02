export interface SendAssessmentEmailParams {
  candidateName: string;
  candidateEmail: string;
  assessmentTitle: string;
  roleApplied?: string;
  accessLink: string;
  timeLimit?: number | string;
  questionsCount?: number | string;
  type?: 'quiz' | 'typing' | 'excel' | 'custom';
  language?: 'es' | 'en';
  assessmentCode?: string;
  temporaryPassword?: string;
}

export interface SendEmailResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
}

export async function sendAssessmentInviteEmail(
  params: SendAssessmentEmailParams
): Promise<SendEmailResponse> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to dispatch email via Microsoft 365',
        details: data.details,
      };
    }

    return {
      success: true,
      message: data.message || 'Invitation email dispatched successfully.',
    };
  } catch (err: any) {
    console.error('Error in sendAssessmentInviteEmail:', err);
    return {
      success: false,
      error: err?.message || 'Network error while attempting to dispatch email',
    };
  }
}
