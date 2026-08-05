'use client';

import React from 'react';
import { QrCode, Search } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

// ============================================
// TYPES
// ============================================

interface EnrollmentDraft {
  name: string;
  taxId: string;
  rg: string;
  birthDate: string;
  address: string;
  phone: string;
  email: string;
  personType: 'individual' | 'company';
  companyId: string;
  discount: number;
  studentStartDate: string;
  studentEndDate: string;
  linkedProducts: string[];
  linkedExtras: string[];
}

interface CompanyPricingInfo {
  courseId: string;
  active: boolean;
  includedProductIds?: string[];
}

interface CompanyOption {
  id: string;
  name: string;
  pricing?: CompanyPricingInfo[];
}

interface ExtraProductOption {
  id: string;
  code: string;
  name: string;
  price: number;
  type: 'product' | 'extra';
}

interface CourseOption {
  id: string;
  name: string;
  linkedProducts?: string[];
  linkedExtras?: string[];
}

interface ClassOption {
  id: string;
  code: string;
  startDate: string;
  endDate: string;
}

interface FoundStudent {
  id: string;
  name: string;
  taxId: string;
  rg?: string;
  birthDate?: string;
  address?: string;
  phone: string;
  email: string;
}

interface EnrollmentFormProps {
  showQRCode: boolean;
  enrollmentToken: string;
  enrollmentData: EnrollmentDraft;
  studentSearch: string;
  foundStudent: FoundStudent | null;
  companies: CompanyOption[];
  extraProducts: ExtraProductOption[];
  course: CourseOption | null;
  classItem: ClassOption | null;
  qrCodeUrl?: string;
  setEnrollmentData: (data: EnrollmentDraft) => void;
  setStudentSearch: (search: string) => void;
  searchExistingStudent: (term: string) => void;
  toggleLinkedProduct: (id: string) => void;
  toggleLinkedExtra: (id: string) => void;
  handleAddStudent: () => void;
  setShowQRCode: (show: boolean) => void;
}

// ============================================
// QR CODE COMPONENT (SVG-based, no external dependency)
// ============================================

// ============================================
// MAIN COMPONENT
// ============================================

export function EnrollmentForm({
  showQRCode,
  enrollmentToken,
  enrollmentData,
  studentSearch,
  foundStudent,
  companies,
  extraProducts,
  course,
  classItem,
  qrCodeUrl,
  setEnrollmentData,
  setStudentSearch,
  searchExistingStudent,
  toggleLinkedProduct,
  toggleLinkedExtra,
  handleAddStudent,
  setShowQRCode,
}: EnrollmentFormProps) {
  // QR Code View
  if (showQRCode) {
    const baseUrl =
      (process.env.NEXT_PUBLIC_PUBLIC_ENROLLMENT_BASE_URL || '').replace(/\/$/, '') ||
      (typeof window !== 'undefined' ? window.location.origin : '');

    const qrUrl = qrCodeUrl || `${baseUrl}/enrollment/${enrollmentToken}`;
    
    return (
      <div className="space-y-4 text-center">
        <div className="p-6 bg-gray-50 rounded-lg">
          <QRCodeSVG
            value={qrUrl}
            size={200}
            className="mx-auto"
          />
        </div>
        <div className="space-y-2">
          <p className="font-semibold">Token de Matrícula Gerado!</p>
          <p className="text-sm text-gray-600">
            Compartilhe este QR Code ou link com o aluno para que ele complete seu cadastro e envie os documentos.
          </p>
          <div className="p-3 bg-gray-100 rounded text-xs break-all">
            {qrUrl}
          </div>
        </div>
        <Button onClick={() => setShowQRCode(false)} className="w-full">
          Fechar
        </Button>
      </div>
    );
  }

  // Filter companies with active pricing for current course
  const companiesWithPricing = companies.filter((companyOption) =>
    companyOption.pricing?.some(
      (pricing) => pricing.courseId === course?.id && pricing.active
    )
  );

  const selectedCompany = companies.find((companyOption) => companyOption.id === enrollmentData.companyId);
  const companyPricing = selectedCompany?.pricing?.find(
    (pricing) => pricing.courseId === course?.id && pricing.active
  );

  const productsForCourse =
    enrollmentData.personType === 'company' && companyPricing
      ? extraProducts.filter(
          (product) =>
            product.type === 'product' && companyPricing.includedProductIds?.includes(product.id)
        )
      : extraProducts.filter(
          (product) =>
            product.type === 'product' && course?.linkedProducts?.includes(product.id)
        );

  const extrasForCourse =
    enrollmentData.personType === 'company' && companyPricing
      ? extraProducts.filter(
          (extra) =>
            extra.type === 'extra' && companyPricing.includedProductIds?.includes(extra.id)
        )
      : extraProducts.filter(
          (extra) =>
            extra.type === 'extra' && course?.linkedExtras?.includes(extra.id)
        );

  const calculateTotalValue = () => {
    let total = 0;

    enrollmentData.linkedProducts.forEach((productId) => {
      const product = extraProducts.find((item) => item.id === productId);
      total += Number(product?.price || 0);
    });

    enrollmentData.linkedExtras.forEach((extraId) => {
      const extra = extraProducts.find((item) => item.id === extraId);
      total += Number(extra?.price || 0);
    });

    total -= Number(enrollmentData.discount || 0);

    return total;
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      {/* Search Existing Student */}
      <div className="border-b pb-4">
        <Label htmlFor="studentSearch" className="text-sm font-semibold text-blue-600">
          🔍 Buscar Aluno Existente
        </Label>
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="studentSearch"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Digite CPF ou código (ex: A0001)"
              className="pl-10"
            />
          </div>
          <Button
            type="button"
            onClick={() => searchExistingStudent(studentSearch)}
            variant="outline"
          >
            Buscar
          </Button>
        </div>
        {foundStudent && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-semibold text-green-700">
              ✓ Aluno encontrado: {foundStudent.name}
            </p>
            <p className="text-xs text-green-600">Dados preenchidos automaticamente</p>
          </div>
        )}
      </div>

      {/* Personal Data */}
      <div>
        <Label htmlFor="nomeAluno">Nome Completo *</Label>
        <Input
          id="nomeAluno"
          value={enrollmentData.name}
          onChange={(e) => setEnrollmentData({ ...enrollmentData, name: e.target.value })}
          placeholder="Ex: João Silva"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cpfAluno">CPF *</Label>
          <Input
            id="cpfAluno"
            value={enrollmentData.taxId}
            onChange={(e) => setEnrollmentData({ ...enrollmentData, taxId: e.target.value })}
            placeholder="000.000.000-00"
            disabled={!!foundStudent}
          />
        </div>
        <div>
          <Label htmlFor="rgAluno">RG</Label>
          <Input
            id="rgAluno"
            value={enrollmentData.rg}
            onChange={(e) => setEnrollmentData({ ...enrollmentData, rg: e.target.value })}
            placeholder="00.000.000-0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nascimentoAluno">Data de Nascimento</Label>
          <Input
            id="nascimentoAluno"
            type="date"
            value={enrollmentData.birthDate}
            onChange={(e) => setEnrollmentData({ ...enrollmentData, birthDate: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="telefoneAluno">Telefone *</Label>
          <Input
            id="telefoneAluno"
            value={enrollmentData.phone}
            onChange={(e) => setEnrollmentData({ ...enrollmentData, phone: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="emailAluno">E-mail *</Label>
        <Input
          id="emailAluno"
          value={enrollmentData.email}
          onChange={(e) => setEnrollmentData({ ...enrollmentData, email: e.target.value })}
          placeholder="exemplo@smcorp.com"
        />
      </div>

      <div>
        <Label htmlFor="enderecoAluno">Endereço Completo</Label>
        <Input
          id="enderecoAluno"
          value={enrollmentData.address}
          onChange={(e) => setEnrollmentData({ ...enrollmentData, address: e.target.value })}
          placeholder="Rua, número, bairro - cidade, UF"
        />
      </div>

      {/* Person Type and Company */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tipoPessoa">Tipo *</Label>
          <Select
            value={enrollmentData.personType}
            onValueChange={(value) =>
              setEnrollmentData({ ...enrollmentData, personType: value as 'individual' | 'company' })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Pessoa Física</SelectItem>
              <SelectItem value="company">Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {enrollmentData.personType === 'company' && (
          <div>
            <Label htmlFor="clientePJ">Empresa PJ *</Label>
            <Select
              value={enrollmentData.companyId || 'selecione'}
              onValueChange={(value) =>
                setEnrollmentData({
                  ...enrollmentData,
                  companyId: value === 'selecione' ? '' : value
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="selecione" disabled>
                  Selecione uma empresa
                </SelectItem>
                {companiesWithPricing.map((companyOption) => (
                  <SelectItem key={companyOption.id} value={companyOption.id}>
                    {companyOption.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Student Participation Dates */}
      <div className="border-t pt-4">
        <Label className="text-sm font-semibold text-purple-600 mb-2 block">
          📅 Período de Participação do Aluno
        </Label>
        <p className="text-xs text-gray-500 mb-3">
          Turma: {formatDate(classItem?.startDate)} até{' '}
          {formatDate(classItem?.endDate)}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dataInicioAluno">Data de Início</Label>
            <Input
              id="dataInicioAluno"
              type="date"
              value={enrollmentData.studentStartDate}
              onChange={(e) =>
                setEnrollmentData({ ...enrollmentData, studentStartDate: e.target.value })
              }
              min={classItem?.startDate}
              max={classItem?.endDate}
            />
          </div>
          <div>
            <Label htmlFor="dataFimAluno">Data de Término</Label>
            <Input
              id="dataFimAluno"
              type="date"
              value={enrollmentData.studentEndDate}
              onChange={(e) =>
                setEnrollmentData({ ...enrollmentData, studentEndDate: e.target.value })
              }
              min={enrollmentData.studentStartDate || classItem?.startDate}
              max={classItem?.endDate}
            />
          </div>
        </div>
      </div>

      {/* Products Linked to Course */}
      {productsForCourse.length > 0 && (
        <div className="border-t pt-4">
          <Label className="text-sm font-semibold text-blue-600 mb-2 block">
            💼 Produtos Disponíveis para este Curso
          </Label>
          {enrollmentData.personType === 'company' && selectedCompany && (
            <div className="mb-3 p-2 bg-blue-50 border border-blue-300 rounded text-xs text-blue-700">
              🏢 Mostrando apenas produtos vinculados à precificação da empresa{' '}
              <strong>{selectedCompany.name}</strong>
            </div>
          )}
          <div className="space-y-2 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
            {productsForCourse.map((product) => (
              <div key={product.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`produto-${product.id}`}
                  checked={enrollmentData.linkedProducts.includes(product.id)}
                  onChange={() => toggleLinkedProduct(product.id)}
                  className="w-4 h-4"
                />
                <label
                  htmlFor={`produto-${product.id}`}
                  className="flex-1 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-blue-600 text-white text-xs">
                      {product.code}
                    </Badge>
                    <span className="text-sm">{product.name}</span>
                  </div>
                  <span className="text-blue-700 font-semibold text-sm">
                    R$ {Number(product.price || 0).toFixed(2)}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extras Linked to Course */}
      {extrasForCourse.length > 0 && (
        <div className="border-t pt-4">
          <Label className="text-sm font-semibold text-purple-600 mb-2 block">
            ⭐ Extras Disponíveis para este Curso
          </Label>
          <div className="space-y-2 border border-purple-200 rounded-lg p-3 bg-purple-50/50">
            {extrasForCourse.map((extra) => (
              <div key={extra.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`extra-${extra.id}`}
                  checked={enrollmentData.linkedExtras.includes(extra.id)}
                  onChange={() => toggleLinkedExtra(extra.id)}
                  className="w-4 h-4"
                />
                <label
                  htmlFor={`extra-${extra.id}`}
                  className="flex-1 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-purple-600 text-white text-xs">
                      {extra.code}
                    </Badge>
                    <span className="text-sm">{extra.name}</span>
                  </div>
                  <span className="text-purple-700 font-semibold text-sm">
                    R$ {Number(extra.price || 0).toFixed(2)}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discount */}
      <div className="border-t pt-4">
        <Label htmlFor="desconto">Desconto (R$)</Label>
        <Input
          id="desconto"
          type="number"
          value={enrollmentData.discount || ''}
          onChange={(e) =>
            setEnrollmentData({ ...enrollmentData, discount: parseFloat(e.target.value) || 0 })
          }
          placeholder="0"
        />
        <p className="text-xs text-gray-500 mt-1">
          Ajustes comerciais requerem aprovação do Master
        </p>
      </div>

      {/* Financial Summary */}
      <div className="border-t pt-4 bg-gray-50 rounded-lg p-4">
        <Label className="text-sm font-semibold text-gray-700 mb-3 block">
          💰 Resumo Financeiro
        </Label>
        <div className="space-y-2 text-sm">
          {enrollmentData.personType === 'company' && selectedCompany && (
            <div className="flex justify-between items-center mb-1 bg-blue-50 p-2 rounded">
              <span className="text-gray-600 text-xs">🏢 Precificação PJ:</span>
              <span className="font-medium text-xs text-blue-600">
                {selectedCompany.name}
              </span>
            </div>
          )}

          {enrollmentData.linkedProducts.length > 0 && (
            <div className="space-y-1">
              {enrollmentData.linkedProducts.map((productId) => {
                const product = extraProducts.find((item) => item.id === productId);
                return product ? (
                  <div key={productId} className="flex justify-between text-blue-600">
                    <span>+ {product.name}</span>
                    <span>R$ {Number(product.price || 0).toFixed(2)}</span>
                  </div>
                ) : null;
              })}
            </div>
          )}

          {enrollmentData.linkedExtras.length > 0 && (
            <div className="space-y-1">
              {enrollmentData.linkedExtras.map((extraId) => {
                const extra = extraProducts.find((item) => item.id === extraId);
                return extra ? (
                  <div key={extraId} className="flex justify-between text-purple-600">
                    <span>+ {extra.name}</span>
                    <span>R$ {Number(extra.price).toFixed(2)}</span>
                  </div>
                ) : null;
              })}
            </div>
          )}

          {enrollmentData.discount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>- Desconto:</span>
              <span>R$ {Number(enrollmentData.discount).toFixed(2)}</span>
            </div>
          )}

          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>Valor Total:</span>
            <span className="text-green-700">R$ {calculateTotalValue().toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Button onClick={handleAddStudent} className="w-full">
        <QrCode className="w-4 h-4 mr-2" />
        Gerar Token de Matrícula
      </Button>
    </div>
  );
}
