import React, { useState } from 'react';
import { Upload, FileText, Search, AlertCircle, CheckCircle2, Loader2, Image as ImageIcon, Lightbulb, Shield } from 'lucide-react';
import Tesseract from 'tesseract.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { apiClient } from '../services/apiClient';

const ReportAnalyzer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [precautions, setPrecautions] = useState<string | null>(null);
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setAnalysis(null);
    }
  };

  const analyzeFile = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setAnalysis(null);
    setSuggestions(null);
    setPrecautions(null);

    try {
      const { data } = await Tesseract.recognize(selectedFile, 'eng', {
        logger: (m) => console.log(m),
      });

      const extractedText = data.text;

      const bpMatch = extractedText.match(/BP[:\s]*([0-9]+\/[0-9]+)/i);
      const spo2Match = extractedText.match(/SpO2[:\s]*([0-9]+)%?/i);
      const hrMatch = extractedText.match(/(Heart Rate|HR)[:\s]*([0-9]+)/i);

      let output = `# Extracted Report Text\n\n${extractedText}\n\n# Detected Medical Values\n\n`;

      if (bpMatch) output += `* Blood Pressure: ${bpMatch[1]}\n`;
      if (spo2Match) output += `* SpO2: ${spo2Match[1]}%\n`;
      if (hrMatch) output += `* Heart Rate: ${hrMatch[2]}\n`;

      if (!bpMatch && !spo2Match && !hrMatch) {
        output += `* No standard vitals detected automatically.\n`;
      }

      setAnalysis(output);

      // Get suggestions and precautions from chatbot
      await getSuggestionsFromChatbot(extractedText);

    } catch (error) {
      console.error("OCR Error:", error);
      setAnalysis("❌ OCR failed. Please upload a clearer image.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSuggestionsFromChatbot = async (reportText: string) => {
    setIsGettingSuggestions(true);
    try {
      const prompt = `Based on this medical report:\n\n${reportText}\n\nPlease provide:\n1. **SUGGESTIONS** - Health recommendations and lifestyle changes\n2. **PRECAUTIONS** - Important warnings and care instructions\n\nFormat your response with clear "SUGGESTIONS:" and "PRECAUTIONS:" sections.`;

      const response = await apiClient.askAI(prompt);
      
      if (response.data?.reply) {
        const fullResponse = response.data.reply;
        
        // Parse suggestions and precautions from response
        const suggestionsMatch = fullResponse.match(/SUGGESTIONS:?([\s\S]*?)(?=PRECAUTIONS:|$)/i);
        const precautionsMatch = fullResponse.match(/PRECAUTIONS:?([\s\S]*?)$/i);

        if (suggestionsMatch) {
          setSuggestions(suggestionsMatch[1].trim());
        }
        if (precautionsMatch) {
          setPrecautions(precautionsMatch[1].trim());
        }

        // If parsing failed, show full response as suggestions
        if (!suggestionsMatch && !precautionsMatch) {
          setSuggestions(fullResponse);
        }
      } else if (response.error) {
        setSuggestions(`⚠️ Error: ${response.error}`);
      }
    } catch (error) {
      console.error("Error getting suggestions:", error);
      setSuggestions("⚠️ Unable to fetch suggestions from AI. Please try again.");
    } finally {
      setIsGettingSuggestions(false);
    }
  };

  const downloadReportPDF = async () => {
    const reportElement = document.getElementById('report-summary');
    if (!reportElement) return;

    const canvas = await html2canvas(reportElement, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= 297;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }

    pdf.save('Medical_Report.pdf');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* Upload Section */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center min-h-[400px] text-center">
            {previewUrl ? (
              <div className="w-full flex flex-col items-center">
                <img
                  src={previewUrl}
                  alt="Report Preview"
                  className="max-h-[300px] w-auto rounded-xl shadow-lg mb-6 border"
                />
                <div className="flex gap-4">
                  <button
                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); setAnalysis(null); }}
                    className="px-6 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium"
                  >
                    Remove
                  </button>
                  <button
                    onClick={analyzeFile}
                    disabled={isAnalyzing}
                    className="px-8 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold flex items-center gap-2"
                  >
                    {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Report'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Upload size={32} className="mb-4 text-blue-600" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Upload Medical Report</h3>
                <label className="cursor-pointer bg-slate-900 text-white px-8 py-3 rounded-xl font-bold">
                  Select File
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* OCR Analysis Results */}
          <div className="bg-white rounded-3xl border shadow-sm min-h-[400px] flex flex-col">
            <div className="px-8 py-6 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                OCR Analysis Results
              </h3>
              {analysis && (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                  <CheckCircle2 size={12} />
                  Ready
                </span>
              )}
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
              {!analysis && !isAnalyzing ? (
                <div className="flex flex-col items-center justify-center text-slate-400 h-full">
                  <ImageIcon size={48} />
                  <p>Analyze a report to see results here.</p>
                </div>
              ) : isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 size={64} className="animate-spin text-blue-600" />
                  <p className="mt-4">Running OCR...</p>
                </div>
              ) : (
                <div id="report-summary" className="prose max-w-none text-sm">
                  {analysis?.split('\n').map((line, i) => {
                    if (line.startsWith('#'))
                      return <h4 key={i} className="font-bold mt-4 mb-2">{line.replace(/#/g, '').trim()}</h4>;
                    if (line.startsWith('*'))
                      return <p key={i} className="ml-4 text-slate-700">• {line.replace(/\*/g, '').trim()}</p>;
                    return line.trim() && <p key={i} className="text-slate-600">{line}</p>;
                  })}
                </div>
              )}
            </div>

            {analysis && (
              <div className="p-6 border-t bg-slate-50">
                <button
                  className="w-full bg-white border font-bold py-3 rounded-xl hover:bg-slate-100"
                  onClick={downloadReportPDF}
                >
                  📥 Download Report Summary
                </button>
              </div>
            )}
          </div>

          {/* Suggestions Section */}
          {(suggestions || isGettingSuggestions) && (
            <div className="bg-white rounded-3xl border shadow-sm border-amber-200">
              <div className="px-8 py-6 border-b bg-amber-50 flex items-center gap-2">
                <Lightbulb size={20} className="text-amber-600" />
                <h3 className="text-lg font-bold text-amber-900">Health Suggestions</h3>
              </div>
              <div className="p-8 text-sm max-h-[300px] overflow-y-auto">
                {isGettingSuggestions ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 size={20} className="animate-spin text-amber-600" />
                    <p>Analyzing and generating suggestions...</p>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-slate-700">
                    {suggestions}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Precautions Section */}
          {(precautions || isGettingSuggestions) && (
            <div className="bg-white rounded-3xl border shadow-sm border-red-200">
              <div className="px-8 py-6 border-b bg-red-50 flex items-center gap-2">
                <Shield size={20} className="text-red-600" />
                <h3 className="text-lg font-bold text-red-900">Important Precautions</h3>
              </div>
              <div className="p-8 text-sm max-h-[300px] overflow-y-auto">
                {isGettingSuggestions ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 size={20} className="animate-spin text-red-600" />
                    <p>Loading precautions...</p>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-slate-700">
                    {precautions}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ReportAnalyzer;