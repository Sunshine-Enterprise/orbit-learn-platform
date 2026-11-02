declare const process: any;

interface SendEmailPayload {
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

function getEnvVar(key: string): string {
  if (typeof process !== 'undefined' && process?.env && process.env[key]) {
    return String(process.env[key]).trim();
  }
  return '';
}

function generateHtmlEmail(payload: SendEmailPayload): { subject: string; html: string } {
  const isEn = payload.language === 'en';
  const name = payload.candidateName || (isEn ? 'Candidate' : 'Postulante');
  const role = payload.roleApplied || (isEn ? 'Position' : 'Puesto de trabajo');
  const title = payload.assessmentTitle || (isEn ? 'Technical Assessment' : 'Evaluación Técnica');
  const link = payload.accessLink || 'https://orbit-learn-platform.vercel.app';
  const timeLimit = payload.timeLimit ? `${payload.timeLimit} min` : (isEn ? 'Untimed' : 'Sin límite');
  const count = payload.questionsCount ? String(payload.questionsCount) : null;

  // Extract or resolve assessment code
  let code = payload.assessmentCode;
  if (!code && payload.accessLink) {
    try {
      const url = new URL(payload.accessLink);
      code = url.searchParams.get('code') || url.searchParams.get('test') || undefined;
    } catch {
      const match = payload.accessLink.match(/[?&](?:code|test)=([^&]+)/);
      if (match) code = decodeURIComponent(match[1]);
    }
  }
  if (!code) {
    code = payload.candidateEmail;
  }

  let modalityLabel = isEn ? 'Question Bank Technical Assessment' : 'Cuestionario de Conocimientos Técnicos';
  if (payload.type === 'typing') {
    modalityLabel = isEn ? 'Typing Speed Assessment' : 'Prueba de Mecanografía y Velocidad';
  } else if (payload.type === 'excel') {
    modalityLabel = isEn ? 'Practical Excel Skills Assessment' : 'Evaluación Práctica en Excel';
  }

  const subject = isEn
    ? `Technical Skills Assessment Invitation: ${title} - Sunshine Enterprise USA`
    : `Invitación a Evaluación Técnica: ${title} - Sunshine Enterprise USA`;

  const html = `
<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'es'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color:#10243e;padding:32px 28px;text-align:center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;padding:6px 14px;background-color:#1d3960;border-radius:20px;border:1px solid #2d558a;margin-bottom:12px;">
                      <span style="font-size:11px;font-weight:700;color:#38bdf8;letter-spacing:0.08em;text-transform:uppercase;">
                        ${isEn ? 'Official Workplace Assessment' : 'Evaluación Técnica Oficial'}
                      </span>
                    </div>
                    <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">
                      SkillProof Enterprise
                    </h1>
                    <p style="margin:6px 0 0 0;font-size:13px;color:#94a3b8;font-weight:500;">
                      Sunshine Enterprise USA • Recruiting & Skills Verification
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding:32px 28px;">
              <p style="margin:0 0 16px 0;font-size:16px;font-weight:600;color:#0f172a;">
                ${isEn ? 'Dear' : 'Estimado(a)'} ${name},
              </p>
              
              <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#475569;">
                ${isEn
                  ? `You have been selected to complete an official technical evaluation for the position of <strong>${role}</strong> as part of the hiring process with Sunshine Enterprise USA.`
                  : `Has sido preseleccionado(a) para completar una evaluación técnica oficial para el puesto de <strong>${role}</strong> como parte de tu proceso de selección en Sunshine Enterprise USA.`
                }
              </p>

              <!-- Assessment Details Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:10px;">
                          <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;display:block;">
                            ${isEn ? 'Assessment Module' : 'Módulo de Evaluación'}
                          </span>
                          <span style="font-size:15px;font-weight:800;color:#0f172a;">
                            ${title}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:10px;">
                          <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;display:block;">
                            ${isEn ? 'Modality' : 'Modalidad'}
                          </span>
                          <span style="font-size:13px;font-weight:600;color:#334155;">
                            ${modalityLabel}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="50%">
                                <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;display:block;">
                                  ${isEn ? 'Time Limit' : 'Tiempo Límite'}
                                </span>
                                <span style="font-size:13px;font-weight:700;color:#2368f5;">
                                  ${timeLimit}
                                </span>
                              </td>
                              ${count ? `
                              <td width="50%">
                                <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;display:block;">
                                  ${isEn ? 'Total Questions' : 'Preguntas'}
                                </span>
                                <span style="font-size:13px;font-weight:700;color:#0f172a;">
                                  ${count}
                                </span>
                              </td>
                              ` : ''}
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Highlighted Assessment Access Credentials Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f7ff;border:2px dashed #93c5fd;border-radius:12px;margin-bottom:24px;text-align:center;">
                <tr>
                  <td style="padding:18px 20px;">
                    <span style="font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:12px;">
                      ${isEn ? 'Your Assessment Access Credentials' : 'Tus Credenciales Oficiales de Acceso'}
                    </span>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 16px;margin-bottom:12px;text-align:left;">
                      <tr>
                        <td style="padding:5px 0;font-size:12px;color:#64748b;font-weight:600;width:42%;">
                          ${isEn ? 'Registered Email:' : 'Correo Registrado:'}
                        </td>
                        <td style="padding:5px 0;font-size:13px;color:#0f172a;font-weight:700;font-family:monospace;">
                          ${payload.candidateEmail}
                        </td>
                      </tr>
                      ${payload.temporaryPassword ? `
                      <tr>
                        <td style="padding:5px 0;font-size:12px;color:#64748b;font-weight:600;">
                          ${isEn ? 'Temporary Password:' : 'Contraseña Temporal:'}
                        </td>
                        <td style="padding:5px 0;font-size:14px;color:#1d4ed8;font-weight:900;font-family:'Courier New',monospace;letter-spacing:0.06em;">
                          ${payload.temporaryPassword}
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding:5px 0;font-size:12px;color:#64748b;font-weight:600;">
                          ${isEn ? 'Assessment Code:' : 'Código de Evaluación:'}
                        </td>
                        <td style="padding:5px 0;font-size:13px;color:#0f172a;font-weight:800;font-family:'Courier New',monospace;">
                          ${code}
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0;font-size:12px;color:#3b82f6;line-height:1.4;">
                      ${isEn
                        ? 'Log in using your registered email and temporary password. You can keep this password or set your own custom password upon entering.'
                        : 'Inicia sesión con tu correo y contraseña temporal. Podrás ingresar con esta clave o establecer tu propia contraseña definitiva al acceder.'
                      }
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Primary CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${link}" target="_blank" style="display:inline-block;padding:15px 36px;background-color:#2368f5;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;box-shadow:0 4px 12px rgba(35,104,245,0.25);letter-spacing:0.02em;">
                      ${isEn ? 'START ASSESSMENT NOW' : 'INICIAR EVALUACIÓN TÉCNICA'}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Important Anti-Fraud & Guidelines Notice -->
              <div style="background-color:#eff6ff;border-left:4px solid:#2368f5;border:1px solid #bfdbfe;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
                <p style="margin:0 0 6px 0;font-size:12px;font-weight:700;color:#1e40af;">
                  ${isEn ? 'Anti-Fraud Identity Verification' : 'Verificación de Identidad Antifraude'}
                </p>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#1e3a8a;">
                  ${isEn
                    ? `Upon opening the link, you will be required to confirm your registered email address (<strong>${payload.candidateEmail}</strong>) to unlock your assessment session.`
                    : `Al abrir el enlace, el portal te solicitará confirmar tu correo electrónico registrado (<strong>${payload.candidateEmail}</strong>) para desbloquear tu sesión de evaluación.`
                  }
                </p>
              </div>

              <!-- Fallback Direct URL -->
              <p style="margin:0;font-size:12px;line-height:1.5;color:#64748b;">
                ${isEn
                  ? 'If the button above does not work, copy and paste the following secure link into your browser:'
                  : 'Si el botón superior no funciona en tu cliente de correo, copia y pega el siguiente enlace directo en tu navegador:'
                }
              </p>
              <p style="margin:6px 0 0 0;font-size:11px;word-break:break-all;color:#2368f5;font-family:monospace;">
                ${link}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 28px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:12px;font-weight:700;color:#334155;">
                Sunshine Enterprise USA
              </p>
              <p style="margin:0 0 6px 0;font-size:11px;color:#64748b;">
                250 N Orange Ave, Orlando, FL • Verified Skills Assessment Platform
              </p>
              <p style="margin:0;font-size:10px;color:#94a3b8;">
                ${isEn
                  ? 'This is an automated transmission sent via web@seu-usa.com. Please do not reply directly to this email.'
                  : 'Este es un mensaje transaccional automatizado enviado desde web@seu-usa.com. Por favor no respondas directamente a este correo.'
                }
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject, html };
}

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    let body: SendEmailPayload = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    if (!body || !body.candidateEmail || !body.accessLink) {
      res.status(400).json({ error: 'Missing candidateEmail or accessLink in request body' });
      return;
    }

    const tenantId = getEnvVar('AZURE_TENANT_ID');
    const clientId = getEnvVar('AZURE_CLIENT_ID');
    const clientSecret = getEnvVar('AZURE_CLIENT_SECRET');
    const fromAddress = getEnvVar('MAIL_FROM_ADDRESS') || 'web@seu-usa.com';
    const fromName = getEnvVar('MAIL_FROM_NAME') || 'SkillProof Enterprise - Sunshine Enterprise USA';

    if (!tenantId || !clientId || !clientSecret) {
      res.status(500).json({
        error: 'Server configuration error: Azure Entra ID credentials are missing.',
      });
      return;
    }

    // 1. Acquire Token from Microsoft Entra ID OAuth 2.0
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      scope: 'https://graph.microsoft.com/.default',
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('Failed to acquire token from Microsoft:', errText);
      res.status(500).json({ error: 'Failed to authenticate with Microsoft 365', details: errText });
      return;
    }

    const tokenJson = (await tokenResponse.json()) as { access_token: string };
    const accessToken = tokenJson.access_token;

    // 2. Generate Brand-Compliant HTML Email
    const { subject, html } = generateHtmlEmail(body);

    // 3. Dispatch Email via Microsoft Graph API
    const sendMailUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(fromAddress)}/sendMail`;

    const mailPayload = {
      message: {
        subject,
        body: {
          contentType: 'HTML',
          content: html,
        },
        toRecipients: [
          {
            emailAddress: {
              address: body.candidateEmail.trim(),
              name: body.candidateName || body.candidateEmail.trim(),
            },
          },
        ],
        from: {
          emailAddress: {
            address: fromAddress,
            name: fromName,
          },
        },
      },
      saveToSentItems: 'true',
    };

    const graphResponse = await fetch(sendMailUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mailPayload),
    });

    if (graphResponse.status === 202 || graphResponse.status === 200) {
      res.status(200).json({
        success: true,
        message: `Assessment invitation dispatched successfully to ${body.candidateEmail}`,
        sender: fromAddress,
      });
      return;
    }

    const graphErr = await graphResponse.text();
    console.error('Microsoft Graph sendMail error:', graphErr);
    res.status(graphResponse.status).json({
      error: 'Microsoft Graph failed to dispatch email',
      details: graphErr,
    });
  } catch (err: any) {
    console.error('Unhandled email dispatch error:', err);
    res.status(500).json({ error: 'Internal server error', message: err?.message });
  }
}
