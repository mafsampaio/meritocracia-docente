/**
 * Utilitário para formatação segura de datas
 * Sempre retorna no formato brasileiro DD/MM/YYYY
 */

/**
 * Formata uma data para o formato brasileiro dd/mm/yyyy
 * @param dateValue Data como objeto Date, string ou null
 * @returns Data formatada ou string vazia se a data for inválida
 */
export function formatDate(dateValue: Date | string | null | undefined): string {
  if (!dateValue) return '';
  
  try {
    // Se já estiver no formato brasileiro, retorna como está
    if (typeof dateValue === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateValue)) {
      return dateValue;
    }

    // Converter para Date se for string
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    
    // Verificar se data é válida
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toLocaleDateString('pt-BR');
    }
    
    // Tentativa manual para string ISO (YYYY-MM-DD)
    if (typeof dateValue === 'string' && dateValue.includes('-')) {
      const parts = dateValue.split('-');
      if (parts.length >= 3) {
        // Ajusta o dia para remover qualquer parte de time
        const dia = parts[2].split('T')[0].split(' ')[0];
        return `${dia.padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
    }
    
    // Qualquer outro caso, retorna a string original
    return String(dateValue);
  } catch (e) {
    console.error("Erro ao formatar data:", e);
    return String(dateValue || '');
  }
}