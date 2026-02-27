import mammoth from 'mammoth'
import TurndownService from 'turndown'

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
})

interface ConvertOptions {
  includeImages?: boolean
}

export async function convertDocxToMd(buffer: Buffer, options: ConvertOptions = {}): Promise<{ success: boolean; markdown?: string; error?: string }> {
  try {
    const mammothOptions = options.includeImages 
      ? undefined
      : {
          convertImage: () => []
        }

    const result = await mammoth.convertToMarkdown({ buffer }, mammothOptions)
    
    return { success: true, markdown: result.value }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during DOCX conversion'
    }
  }
}
