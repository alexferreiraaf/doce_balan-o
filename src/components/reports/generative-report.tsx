'use client';
import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { getGenerativeReport } from '@/app/actions/reports';
import type { Transaction } from '@/app/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface GenerativeReportProps {
    transactions: Transaction[];
}

export function GenerativeReport({ transactions }: GenerativeReportProps) {
    const [report, setReport] = useState('');
    const [error, setError] = useState('');
    const [isPending, startTransition] = useTransition();
    const [period, setPeriod] = useState('monthly');

    const handleGenerateReport = () => {
        startTransition(async () => {
            setError('');
            setReport('');

            const today = new Date();
            let startDate = new Date();

            switch (period) {
                case 'weekly':
                    startDate.setDate(today.getDate() - 7);
                    break;
                case 'monthly':
                    startDate.setMonth(today.getMonth() - 1);
                    break;
                case 'all':
                default:
                    startDate = new Date(0); // Epoch
                    break;
            }
            const startDateMs = startDate.getTime();

            const filteredTransactions = transactions.filter(t => t.dateMs >= startDateMs);
            
            if (filteredTransactions.length === 0) {
                setError('Não há transações no período selecionado para gerar um relatório.');
                return;
            }

            try {
                const generatedReport = await getGenerativeReport(filteredTransactions, period);
                setReport(generatedReport);
            } catch (e) {
                console.error(e);
                setError('Ocorreu um erro ao gerar a análise. Por favor, tente novamente.');
            }
        });
    };
    
    // Format the report text with paragraphs
    const formattedReport = report.split('\n').map((paragraph, index) => (
        <p key={index} className="mb-4 last:mb-0">{paragraph}</p>
    ));

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                     <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Sparkles className="text-primary" />
                        Análise com IA
                    </CardTitle>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select value={period} onValueChange={setPeriod} disabled={isPending}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Selecione o período" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="monthly">Últimos 30 dias</SelectItem>
                                <SelectItem value="weekly">Últimos 7 dias</SelectItem>
                                <SelectItem value="all">Todo o período</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleGenerateReport} disabled={isPending} className="w-full sm:w-auto">
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Gerando...
                                </>
                            ) : 'Gerar Análise'}
                        </Button>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground pt-2">
                    Receba um resumo inteligente sobre o desempenho financeiro do seu negócio no período selecionado.
                </p>
            </CardHeader>
            <CardContent>
                {isPending && (
                    <div className="flex justify-center items-center py-10">
                        <div className="text-center text-muted-foreground">
                            <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" />
                            <p>Analisando seus dados...</p>
                        </div>
                    </div>
                )}
                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {report && (
                     <div className={cn("prose prose-sm max-w-none text-card-foreground", 
                        "prose-headings:text-primary prose-strong:text-card-foreground"
                     )}>
                       {formattedReport}
                    </div>
                )}
                 {!report && !isPending && !error && (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>Clique em "Gerar Análise" para ver os insights da IA.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
