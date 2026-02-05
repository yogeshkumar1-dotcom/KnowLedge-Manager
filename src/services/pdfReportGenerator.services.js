import puppeteer from 'puppeteer';

const generateInterviewReportHTML = (interview) => {
  const formatDate = (date) => new Date(date).toLocaleDateString();
  const formatScore = (score) => score ? `${score}/10` : 'N/A';

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Interview Report - ${interview.candidateName}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
            .candidate-name { font-size: 28px; font-weight: bold; color: #007bff; margin-bottom: 10px; }
            .interview-info { font-size: 14px; color: #666; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 20px; font-weight: bold; color: #333; margin-bottom: 15px; border-left: 4px solid #007bff; padding-left: 15px; }
            .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
            .score-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef; }
            .score-value { font-size: 24px; font-weight: bold; color: #007bff; }
            .score-label { font-size: 14px; color: #666; margin-top: 5px; }
            .summary-box { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin-bottom: 20px; }
            .feedback-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .feedback-section { background: #f8f9fa; padding: 20px; border-radius: 8px; }
            .feedback-title { font-weight: bold; margin-bottom: 10px; }
            .positive { border-left: 4px solid #28a745; }
            .improvement { border-left: 4px solid #ffc107; }
            .feedback-list { list-style: none; padding: 0; }
            .feedback-list li { margin-bottom: 8px; padding-left: 20px; position: relative; }
            .feedback-list li:before { content: "•"; color: #007bff; font-weight: bold; position: absolute; left: 0; }
            .metrics-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .metrics-table th, .metrics-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            .metrics-table th { background-color: #f8f9fa; font-weight: bold; }
            .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .status-scored { background: #d4edda; color: #155724; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="candidate-name">${interview.candidateName}</div>
            <div class="interview-info">
                Interview Date: ${formatDate(interview.interviewDate)} | 
                File: ${interview.fileName} | 
                <span class="status-badge status-scored">Status: ${interview.status}</span>
            </div>
        </div>

        ${interview.overall_communication_score ? `
        <div class="section">
            <div class="section-title">Overall Scores</div>
            <div class="score-grid">
                <div class="score-card">
                    <div class="score-value">${formatScore(interview.overall_communication_score)}</div>
                    <div class="score-label">Overall Communication</div>
                </div>
                <div class="score-card">
                    <div class="score-value">${formatScore(interview.language_quality?.fluency_score)}</div>
                    <div class="score-label">Fluency</div>
                </div>
                <div class="score-card">
                    <div class="score-value">${formatScore(interview.communication_skills?.confidence_score)}</div>
                    <div class="score-label">Confidence</div>
                </div>
                <div class="score-card">
                    <div class="score-value">${formatScore(interview.language_quality?.clarity_score)}</div>
                    <div class="score-label">Clarity</div>
                </div>
            </div>
        </div>
        ` : ''}

        ${interview.summary?.verdict ? `
        <div class="section">
            <div class="section-title">AI Summary</div>
            <div class="summary-box">
                "${interview.summary.verdict}"
            </div>
        </div>
        ` : ''}

        ${interview.language_quality || interview.communication_skills ? `
        <div class="section">
            <div class="section-title">Detailed Metrics</div>
            <table class="metrics-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Metric</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${interview.language_quality ? `
                    <tr><td rowspan="3">Language Quality</td><td>Grammar</td><td>${formatScore(interview.language_quality.grammar_score)}</td></tr>
                    <tr><td>Clarity</td><td>${formatScore(interview.language_quality.clarity_score)}</td></tr>
                    <tr><td>Fluency</td><td>${formatScore(interview.language_quality.fluency_score)}</td></tr>
                    ` : ''}
                    ${interview.communication_skills ? `
                    <tr><td rowspan="4">Communication Skills</td><td>Confidence</td><td>${formatScore(interview.communication_skills.confidence_score)}</td></tr>
                    <tr><td>Structure</td><td>${formatScore(interview.communication_skills.structure_score)}</td></tr>
                    <tr><td>Relevance</td><td>${formatScore(interview.communication_skills.relevance_score)}</td></tr>
                    <tr><td>Engagement</td><td>${formatScore(interview.communication_skills.engagement_score)}</td></tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
        ` : ''}

        ${interview.speech_metrics ? `
        <div class="section">
            <div class="section-title">Speech Metrics</div>
            <table class="metrics-table">
                <tbody>
                    ${interview.speech_metrics.words_per_minute ? `<tr><td>Words per Minute</td><td>${interview.speech_metrics.words_per_minute}</td></tr>` : ''}
                    ${interview.speech_metrics.filler_words?.total_count ? `<tr><td>Filler Words Count</td><td>${interview.speech_metrics.filler_words.total_count}</td></tr>` : ''}
                    ${interview.speech_metrics.filler_words?.fillers_per_minute ? `<tr><td>Fillers per Minute</td><td>${interview.speech_metrics.filler_words.fillers_per_minute}</td></tr>` : ''}
                    ${interview.speech_metrics.pause_analysis?.average_pause_duration_seconds ? `<tr><td>Average Pause Duration</td><td>${interview.speech_metrics.pause_analysis.average_pause_duration_seconds}s</td></tr>` : ''}
                </tbody>
            </table>
        </div>
        ` : ''}

        ${interview.coaching_feedback ? `
        <div class="section">
            <div class="section-title">Coaching Feedback</div>
            <div class="feedback-grid">
                ${interview.coaching_feedback.what_went_well?.length ? `
                <div class="feedback-section positive">
                    <div class="feedback-title">What Went Well</div>
                    <ul class="feedback-list">
                        ${interview.coaching_feedback.what_went_well.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                ${interview.coaching_feedback.what_to_improve?.length ? `
                <div class="feedback-section improvement">
                    <div class="feedback-title">Areas to Improve</div>
                    <ul class="feedback-list">
                        ${interview.coaching_feedback.what_to_improve.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            ${interview.coaching_feedback.actionable_tips?.length ? `
            <div class="feedback-section" style="margin-top: 20px;">
                <div class="feedback-title">Actionable Tips</div>
                <ul class="feedback-list">
                    ${interview.coaching_feedback.actionable_tips.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
        ` : ''}

        <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} | Knowledge Manager Interview Report</p>
        </div>
    </body>
    </html>
  `;
};

export const generateInterviewPDF = async (interview) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    const html = generateInterviewReportHTML(interview);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    return pdf;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export const generatePDFFromHTML = async (htmlContent) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    return pdf;
  } catch (error) {
    console.error('Error generating PDF from HTML:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};