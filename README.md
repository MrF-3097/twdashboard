# Agent Dashboard Minimal

A professional Next.js dashboard with document conversion, AI-powered real estate ad generation, and printer driver management tools.

## Features

### 📄 Document Converter
- **DOCX ↔ PDF Conversion**: Convert between Word documents and PDFs
- **Format Preservation**: Maintains perfect formatting during conversion
- **Drag & Drop Upload**: Easy file upload with drag and drop support
- **Progress Tracking**: Real-time conversion progress with status updates
- **Batch Processing**: Convert multiple files simultaneously

### 🏠 GPT-Powered Real Estate Ad Generator
- **Romanian Language**: Generate professional real estate ads in Romanian
- **Property Details**: Comprehensive form for property information
- **AI-Powered**: Uses GPT to create persuasive, professional ad copy
- **Customizable**: Set word limits, tone, and mandatory keywords
- **Export Options**: Copy to clipboard or download as text file

### 🖨️ Printer Driver Downloads
- **OS Detection**: Automatically detects your operating system
- **Compatible Drivers**: Get the right drivers for Windows, macOS, and Linux
- **Multiple Brands**: Support for HP, Canon, Epson, and more
- **Installation Guide**: Step-by-step installation instructions
- **Troubleshooting**: Common issues and solutions

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **TypeScript**: Full type safety throughout the application
- **Icons**: Lucide React for consistent iconography
- **File Handling**: React Dropzone for drag & drop functionality

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd agent-dashboard-minimal
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Optional: Add your API keys here
# OPENAI_API_KEY=your_openai_key_here
# DOCUMENT_CONVERTER_API_KEY=your_converter_key_here
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard page
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── modules/          # Feature modules
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
└── types/                # TypeScript type definitions
```

## API Integration

The dashboard includes placeholder API calls that can be easily integrated with your backend:

### Document Conversion API
```typescript
// POST /api/documents/convert
// Converts DOCX ↔ PDF files
```

### Real Estate Ad Generation API
```typescript
// POST /api/real-estate/generate
// Generates Romanian real estate ads using GPT
```

### Printer Driver API
```typescript
// GET /api/printers/drivers/{os}
// Returns available drivers for specific OS
```

## Customization

### Adding New Features
1. Create a new module in `src/components/modules/`
2. Add the corresponding hook in `src/hooks/`
3. Update the main dashboard page to include the new module
4. Add API endpoints in `src/lib/api.ts`

### Styling
- Modify `tailwind.config.js` for theme customization
- Update `src/app/globals.css` for global styles
- Use shadcn/ui components for consistent design

### Backend Integration
1. Replace mock API calls in `src/lib/api.ts`
2. Update environment variables
3. Implement proper error handling
4. Add authentication if needed

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
```bash
# Build the application
npm run build

# Start production server
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review the code comments for implementation details

---

**Built with ❤️ for professional agents and businesses**

