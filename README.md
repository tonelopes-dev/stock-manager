# 📦 STOCKLY

> **A modern inventory management system designed to help small and medium-sized businesses organize their stock efficiently.**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.10-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.19.1-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

## 🎯 **Project Overview**

STOCKLY is a comprehensive inventory management solution built specifically for small and medium-sized enterprises (SMEs). Our mission is to simplify stock organization, streamline product management, and provide valuable insights to help businesses grow efficiently.

### ✨ **Key Features**

- **📋 Product Management**: Complete CRUD operations for inventory items
- **� Sales Management**: Track sales and revenue with detailed reports
- **�📊 Dashboard Analytics**: Real-time insights with revenue charts and metrics
- **📈 Stock Tracking**: Monitor inventory levels with automatic status updates
- ** Advanced Filtering**: Search and filter products by various criteria
- **📱 Responsive Design**: Mobile-first approach for on-the-go management
- **🎨 Modern UI**: Clean, intuitive interface built with shadcn/ui components
- **🌙 Dark/Light Theme**: Full theme support for user preference
- **⚡ Fast Performance**: Optimized with Next.js 14 App Router
- **🔒 Type-Safe**: Full TypeScript implementation for reliability

## 🚀 **Tech Stack**

### **Frontend**

| Technology   | Version | Description                     |
| ------------ | ------- | ------------------------------- |
| Next.js      | 14.2.10 | React framework with App Router |
| React        | 18      | UI library with hooks           |
| TypeScript   | 5       | Type-safe development           |
| Tailwind CSS | 3.4.1   | Utility-first CSS framework     |
| shadcn/ui    | -       | Modern React component library  |
| Radix UI     | -       | Accessible UI primitives        |
| Lucide React | 0.441.0 | Beautiful icon library          |
| Recharts     | 2.12.7  | Charting library for analytics  |

### **Backend & Database**

| Technology       | Version | Description                |
| ---------------- | ------- | -------------------------- |
| Prisma           | 5.19.1  | Next-generation ORM        |
| PostgreSQL       | 17      | Robust relational database |
| Zod              | 3.23.8  | Schema validation library  |
| next-safe-action | 7.9.3   | Type-safe server actions   |

### **Development Tools**

| Tool           | Version | Description                   |
| -------------- | ------- | ----------------------------- |
| ESLint         | 8       | Code linting                  |
| Prettier       | 3.3.3   | Code formatting               |
| Docker         | -       | Containerization              |
| Docker Compose | -       | Multi-container orchestration |

## 🛠️ **Installation & Setup**

### **Prerequisites**

- Node.js 18+
- npm or yarn
- Docker & Docker Compose (recommended)

---

## 🐳 **Running with Docker (Recommended)**

### **Option 1: Development Mode (Local Next.js + Docker Database)**

This is the recommended setup for development - runs the database in Docker and the Next.js app locally for hot-reload:

```bash
# 1. Start the PostgreSQL database
docker-compose up -d stockly-db

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Run database migrations
npx prisma migrate deploy

# 5. Start development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### **Option 2: Full Docker Setup (Production-like)**

Run everything containerized (both app and database):

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### **Docker Commands Reference**

```bash
# Start only the database
docker-compose up -d stockly-db

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Rebuild containers
docker-compose up --build
```

---

## 💻 **Running Without Docker**

If you prefer to use your own PostgreSQL installation:

1. **Clone the repository**

   ```bash
   git clone https://github.com/tonelopes-dev/stockly.git
   cd stockly
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   Create a `.env` file with your database credentials:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/stockly"
   ```

4. **Database Setup**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate deploy
   ```

5. **Start Development Server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ **Environment Variables**

| Variable       | Description                  | Default                                             |
| -------------- | ---------------------------- | --------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/stockly` |

### **Docker Environment (docker-compose.yml)**

| Variable            | Description       | Default    |
| ------------------- | ----------------- | ---------- |
| `POSTGRES_USER`     | Database user     | `user`     |
| `POSTGRES_PASSWORD` | Database password | `password` |
| `POSTGRES_DB`       | Database name     | `stockly`  |

---

## 📊 **Database Schema**

```mermaid
erDiagram
    Product ||--o{ SaleProduct : "has many"
    Sale ||--o{ SaleProduct : "contains"

    Product {
        string id PK
        string name
        decimal price
        int stock
        datetime createdAt
        datetime updatedAt
    }

    Sale {
        string id PK
        datetime date
        datetime createdAt
        datetime updatedAt
    }

    SaleProduct {
        string id PK
        string saleId FK
        string productId FK
        decimal unitPrice
        int quantity
        datetime createdAt
        datetime updatedAt
    }
```

---

## 🎨 **Features in Detail**

### **Dashboard**

- ✅ Total revenue overview
- ✅ Today's revenue tracking
- ✅ Last 14 days revenue chart
- ✅ Total products count
- ✅ Stock status monitoring
- ✅ Most sold products list

### **Product Management**

- ✅ Add new products with name, price, and stock quantity
- ✅ Edit existing product information
- ✅ Delete products with confirmation dialog
- ✅ Automatic stock status calculation (In Stock / Out of Stock)
- ✅ Real-time price formatting and validation

### **Sales Management**

- ✅ Create and manage sales
- ✅ Multi-product sales support
- ✅ Automatic stock deduction
- ✅ Sales history and tracking

### **User Interface**

- ✅ Responsive data tables with sorting and filtering
- ✅ Modal dialogs for product creation/editing
- ✅ Toast notifications for user feedback
- ✅ Dark/Light theme support with next-themes
- ✅ Accessible components following WCAG guidelines

---

## 🧪 **Available Scripts**

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npx prisma generate       # Generate Prisma client
npx prisma migrate dev    # Create and run migrations (dev)
npx prisma migrate deploy # Run migrations (production)
npx prisma studio         # Open Prisma Studio GUI
npx prisma db push        # Push schema changes (dev)

# Code Quality
npm run lint         # Run ESLint
```

---

## 📁 **Project Structure**

```
stockly/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Dashboard route group
│   │   └── _components/    # Dashboard-specific components
│   ├── products/           # Products management
│   │   └── _components/    # Product components
│   ├── sales/              # Sales management
│   │   └── _components/    # Sales components
│   ├── _actions/           # Server actions
│   ├── _components/        # Shared components
│   │   └── ui/             # UI components (shadcn)
│   ├── _data-access/       # Data access layer
│   └── _lib/               # Utility functions
├── prisma/                 # Database schema & migrations
├── public/                 # Static assets
├── docker-compose.yml      # Docker configuration
├── Dockerfile              # Container build instructions
└── package.json            # Dependencies & scripts
```

---

## 🤝 **Contributing**

We welcome contributions from the community! This project aims to help small and medium businesses, and your contributions can make a real impact.

### **How to Contribute**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Development Guidelines**

- Follow the existing code style and conventions
- Add TypeScript types for all new code
- Include appropriate error handling
- Test your changes thoroughly
- Update documentation as needed

---

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 **Target Audience**

STOCKLY is specifically designed for:

- **Small Retail Businesses** - Local stores, boutiques, and specialty shops
- **Medium-sized Enterprises** - Growing businesses with complex inventory needs
- **E-commerce Businesses** - Online retailers managing multiple products
- **Service Businesses** - Companies tracking supplies and materials
- **Restaurants & Cafes** - Food service businesses managing ingredients

---

## 🌟 **Why Choose STOCKLY?**

| Feature                   | Benefit                                            |
| ------------------------- | -------------------------------------------------- |
| 🎯 **SME-Focused**        | Built specifically for small and medium businesses |
| 💡 **Simple & Intuitive** | No complex setup or training required              |
| 🐳 **Docker Ready**       | One-command deployment with Docker Compose         |
| 🚀 **Modern Technology**  | Latest web technologies for best performance       |
| 💰 **Cost-Effective**     | Open source solution with no licensing fees        |
| 🔧 **Customizable**       | Easily adaptable to specific business needs        |
| 📱 **Mobile-Ready**       | Access your inventory anywhere, anytime            |

---

## 📞 **Support & Community**

- **Issues**: [GitHub Issues](https://github.com/tonelopes-dev/stockly/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tonelopes-dev/stockly/discussions)
- **Documentation**: [Wiki](https://github.com/tonelopes-dev/stockly/wiki)

---

<div align="center">

**Made with ❤️ for small and medium businesses worldwide**

[🌐 Website](https://stockly-demo.vercel.app) • [📖 Documentation](https://github.com/tonelopes-dev/stockly/wiki) • [🐛 Report Bug](https://github.com/tonelopes-dev/stockly/issues) • [✨ Request Feature](https://github.com/tonelopes-dev/stockly/issues)

</div>
