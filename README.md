# Job Tracker & Keywords Manager

A comprehensive job application tracking system built with Next.js, TypeScript, and local IndexedDB storage. Track your job applications, manage keywords, monitor application status, and maintain detailed activity logs - all stored locally in your browser.

## ✨ Features

### 🎯 **Job Application Management**

- **Dual View Modes**: Switch between Kanban board and table views
- **Complete Job Details**: Track company, position, salary estimates, interest levels, and reference numbers
- **Status Tracking**: Monitor applications through stages (Not Applied → Applied → Interview → Offer/Rejected/Withdrawn)
- **Smart Interest Rating**: Rate positions 1-10 with color-coded indicators (🔴 Low, 🟡 Medium, 🟢 High)

### 🏢 **Employer Management**

- **Company Profiles**: Store company information and notes
- **Duplicate Prevention**: Automatically detect and prevent duplicate entries
- **Company Insights**: Track multiple positions at the same company

### 🏷️ **Keyword System**

- **Smart Suggestions**: Pre-categorized technical and soft skills
- **Custom Keywords**: Add your own relevant keywords
- **Keyword Analytics**: Track which skills appear most frequently
- **Search & Filter**: Find keywords as you type with intelligent suggestions

### 📊 **Activity Logging**

- **Automatic Tracking**: Status changes are automatically logged
- **Manual Activities**: Record interviews, follow-ups, and other interactions
- **Detailed History**: View complete timeline for each application
- **Rich Activity Data**: Track activity types, notes, and status transitions

### 📈 **Views & Analytics**

- **Kanban Board**: Visual pipeline with color-coded status columns
- **Data Table**: Sortable, searchable table view with all details
- **Keyword Statistics**: Analyze your most used skills and keywords
- **Activity Timeline**: Chronological view of all application activities

### 💾 **Data Management**

- **Local Storage**: All data stored in browser's IndexedDB (no external servers)
- **Import/Export**: Backup and restore your data as JSON files
- **Privacy First**: Your data never leaves your device
- **Offline Ready**: Works completely offline

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd job-tracker-keywords
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 How to Use

### Adding Your First Job Application

1. **Select/Add Employer**: Choose an existing company or add a new one
2. **Fill Job Details**:
   - Job title and company information
   - Job posting link and reference number
   - Salary estimate and interest level (1-10)
3. **Add Keywords**: Select from suggested technical/soft skills or add custom ones
4. **Save**: Your application is now being tracked!

### Managing Applications

#### Kanban Board View

- **Visual Pipeline**: See all applications organized by status
- **Drag & Drop**: Move cards between status columns (feature can be added)
- **Quick Actions**: Update status, view activity log, edit details, or delete
- **Color Coding**: Each status has its own color for easy identification

#### Table View

- **Comprehensive Data**: See all details in a sortable, searchable table
- **Bulk Operations**: Manage multiple applications efficiently
- **Export Ready**: Perfect for creating reports or backups

### Activity Tracking

1. **Automatic Logging**: Status changes are tracked automatically
2. **Manual Activities**: Click the activity log button to add:
   - Interview scheduled/completed
   - Follow-up emails sent
   - Recruiter contacts
   - Application submissions
3. **View History**: Complete timeline with dates, times, and notes

### Data Management

#### Export Your Data

1. Navigate to Settings/Import-Export
2. Click "Export Data"
3. Save the JSON file as backup

#### Import Data

1. Click "Import Data"
2. Select your JSON backup file
3. Choose to skip duplicates or overwrite

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5.2, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Dexie.js (IndexedDB wrapper)
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with theme provider
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # shadcn/ui base components
│   ├── AddJobForm.tsx    # Job application form
│   ├── JobsList.tsx      # Main container with view toggle
│   ├── JobsKanban.tsx    # Kanban board view
│   ├── JobsTable.tsx     # Table view
│   ├── ActivityLogDialog.tsx  # Activity history modal
│   ├── JobUpdateDialog.tsx    # Status/activity update modal
│   ├── KeywordStats.tsx      # Keyword analytics
│   └── ImportExport.tsx      # Data management
└── lib/                   # Utilities and services
    ├── database.ts        # TypeScript interfaces & DB schema
    ├── db-services.ts     # Database operations
    ├── import-export.ts   # Data import/export functions
    └── utils.ts           # Utility functions
```

## 🎨 Key Features in Detail

### Interest Level System

Rate each position from 1-10 with visual indicators:

- **🔴 1-3**: Low interest (maybe not the best fit)
- **🟡 4-6**: Medium interest (decent opportunity)
- **🟢 7-10**: High interest (dream job territory!)

### Smart Keyword Management

- **Technical Skills**: React, TypeScript, Python, AWS, Docker, etc.
- **Soft Skills**: Leadership, Communication, Problem Solving, etc.
- **Custom Keywords**: Add industry-specific or unique skills
- **Analytics**: See which keywords you use most often

### Activity Types

- **Status Changes**: Automatic tracking when you move applications through the pipeline
- **Manual Activities**: Interviews, emails, calls, networking events, etc.
- **Rich History**: Complete timeline with notes and context

## 🔒 Privacy & Security

- **Local First**: All data stored in your browser's IndexedDB
- **No Tracking**: No analytics, no data collection, no external servers
- **Offline Capable**: Works without internet connection
- **Export Control**: You own your data - export anytime

## 🤝 Contributing

This is a personal project, but contributions are welcome! Please feel free to:

- Report bugs or issues
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🚀 Future Enhancements

Potential features for future versions:

- **Calendar Integration**: Sync with Google Calendar for interviews
- **Email Templates**: Generate follow-up email templates
- **Networking Tracker**: Track contacts and referrals
- **Salary Analytics**: Compare offers and market rates
- **Application Reminders**: Get notified about follow-ups
- **Resume Matching**: Track which resume version was sent where

---

**Happy Job Hunting!** 🎯 May this tool help you land your dream job!
