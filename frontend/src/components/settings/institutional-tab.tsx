'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { Save, Building2 } from 'lucide-react';
import { useSettingsStore, type InstitutionalData } from '@/stores/settings.store';
import { companiesService } from '@/services/companies.service';

// ============================================
// Types
// ============================================

interface InstitutionalFormData {
  name: string;
  legalName: string;
  companyTaxId: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  website: string;
  brandColor: string;
  logo: string;
  bankName: string;
  bankAgency: string;
  bankAccount: string;
  pixKey: string;
  cashBox: number;
  cashNotes: string;
}

const initialFormData: InstitutionalFormData = {
  name: '',
  legalName: '',
  companyTaxId: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  website: '',
  brandColor: '',
  logo: '',
  bankName: '',
  bankAgency: '',
  bankAccount: '',
  pixKey: '',
  cashBox: 0,
  cashNotes: '',
};

// ============================================
// Component
// ============================================

export function InstitutionalTab() {
  const { institutionalData, setInstitutionalData } = useSettingsStore();
  const [formData, setFormData] = useState<InstitutionalFormData>(initialFormData);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing data
  useEffect(() => {
    if (institutionalData) {
      setFormData({
        name: institutionalData.name || '',
        legalName: institutionalData.legalName || '',
        companyTaxId: institutionalData.companyTaxId || '',
        phone: institutionalData.phone || '',
        email: institutionalData.email || '',
        address: institutionalData.address || '',
        city: institutionalData.city || '',
        state: institutionalData.state || '',
        zipCode: institutionalData.zipCode || '',
        website: institutionalData.website || '',
        brandColor: institutionalData.brandColor || '',
        logo: institutionalData.logo || '',
        bankName: institutionalData.bankName || '',
        bankAgency: institutionalData.bankAgency || '',
        bankAccount: institutionalData.bankAccount || '',
        pixKey: institutionalData.pixKey || '',
        cashBox: institutionalData.cashBox || 0,
        cashNotes: institutionalData.cashNotes || '',
      });
    }
  }, [institutionalData]);

  useEffect(() => {
    let mounted = true;

    const loadInstitutionalData = async () => {
      setIsLoading(true);
      try {
        const companiesResponse = await companiesService.getAll(1, 1);
        const targetCompany = companiesResponse.data[0];

        if (!targetCompany) {
          return;
        }

        if (!mounted) return;
        setCompanyId(targetCompany.id);

        const [company, companySettings] = await Promise.all([
          companiesService.getById(targetCompany.id),
          companiesService.getSettings(targetCompany.id),
        ]);

        if (!mounted) return;

        const mappedData: InstitutionalData = {
          id: targetCompany.id,
          name: company.name || '',
          legalName: companySettings.settings?.institutional?.legalName || company.tradeName || '',
          companyTaxId: company.companyTaxId || '',
          phone: company.phone || '',
          email: company.email || '',
          address: company.address || '',
          city: company.city || '',
          state: company.state || '',
          zipCode: company.zipCode || '',
          website: companySettings.settings?.institutional?.website || undefined,
          brandColor: companySettings.settings?.institutional?.brandColor || undefined,
          logo: institutionalData?.logo || undefined,
          bankName: companySettings.settings?.bank?.bank || undefined,
          bankAgency: companySettings.settings?.bank?.agency || undefined,
          bankAccount: companySettings.settings?.bank?.account || undefined,
          pixKey: companySettings.settings?.bank?.pixKey || undefined,
          cashBox: companySettings.settings?.institutional?.cashBox
            ? Number(companySettings.settings.institutional.cashBox)
            : undefined,
          cashNotes: companySettings.settings?.institutional?.cashNotes || undefined,
        };

        setInstitutionalData(mappedData);
      } catch {
        toast.error('Falha ao carregar dados institucionais do servidor');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadInstitutionalData();

    return () => {
      mounted = false;
    };
  }, [setInstitutionalData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!companyId) {
        toast.error('Nenhuma empresa disponível para salvar os dados institucionais');
        return;
      }

      await companiesService.update(companyId, {
        name: formData.name,
        tradeName: formData.legalName || undefined,
        companyTaxId: formData.companyTaxId.replace(/\D/g, ''),
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
      });

      await companiesService.updateSettings(companyId, {
        institutional: {
          legalName: formData.legalName || undefined,
          website: formData.website || undefined,
          brandColor: formData.brandColor || undefined,
          cashBox: String(formData.cashBox || 0),
          cashNotes: formData.cashNotes || undefined,
        },
        bank: {
          bank: formData.bankName || undefined,
          agency: formData.bankAgency || undefined,
          account: formData.bankAccount || undefined,
          pixKey: formData.pixKey || undefined,
        },
      });

      const data: InstitutionalData = {
        id: companyId,
        name: formData.name,
        legalName: formData.legalName || undefined,
        companyTaxId: formData.companyTaxId,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        website: formData.website || undefined,
        brandColor: formData.brandColor || undefined,
        logo: formData.logo || undefined,
        bankName: formData.bankName || undefined,
        bankAgency: formData.bankAgency || undefined,
        bankAccount: formData.bankAccount || undefined,
        pixKey: formData.pixKey || undefined,
        cashBox: formData.cashBox || undefined,
        cashNotes: formData.cashNotes || undefined,
      };
      setInstitutionalData(data);
      toast.success('Dados institucionais salvos com sucesso!');
    } catch {
      toast.error('Erro ao salvar dados institucionais');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          <div>
            <CardTitle>Dados Institucionais</CardTitle>
            <CardDescription>Configure as informações da sua instituição</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instName">Nome da Empresa</Label>
            <Input
              id="instName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome fantasia"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instLegalName">Razao Social</Label>
            <Input
              id="instLegalName"
              value={formData.legalName}
              onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
              placeholder="Razao social"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instCnpj">CNPJ</Label>
            <Input
              id="instCnpj"
              value={formData.companyTaxId}
              onChange={(e) => setFormData({ ...formData, companyTaxId: e.target.value })}
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instPhone">Telefone</Label>
            <Input
              id="instPhone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(00) 0000-0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instEmail">E-mail</Label>
            <Input
              id="instEmail"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contato@empresa.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instWebsite">Site</Label>
            <Input
              id="instWebsite"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://empresa.com"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="instAddress">Endereço</Label>
            <Input
              id="instAddress"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rua, número, bairro"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instCity">Cidade</Label>
            <Input
              id="instCity"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Cidade"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instState">Estado</Label>
            <Input
              id="instState"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="UF"
              maxLength={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instZipCode">CEP</Label>
            <Input
              id="instZipCode"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              placeholder="00000-000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instLogo">URL do Logo</Label>
            <Input
              id="instLogo"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instBrandColor">Cor da Marca</Label>
            <Input
              id="instBrandColor"
              value={formData.brandColor}
              onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
              placeholder="#000000"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Dados Financeiros</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instBank">Banco</Label>
              <Input
                id="instBank"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="Nome do banco"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instAgency">Agencia</Label>
              <Input
                id="instAgency"
                value={formData.bankAgency}
                onChange={(e) => setFormData({ ...formData, bankAgency: e.target.value })}
                placeholder="0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instAccount">Conta Corrente</Label>
              <Input
                id="instAccount"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                placeholder="00000-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instPix">Chave Pix</Label>
              <Input
                id="instPix"
                value={formData.pixKey}
                onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                placeholder="CPF, email ou telefone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instCashBox">Caixa Físico (R$)</Label>
              <Input
                id="instCashBox"
                type="number"
                min={0}
                step={0.01}
                value={formData.cashBox || ''}
                onChange={(e) => setFormData({ ...formData, cashBox: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="instCashNotes">Observacoes do Caixa</Label>
              <Textarea
                id="instCashNotes"
                value={formData.cashNotes}
                onChange={(e) => setFormData({ ...formData, cashNotes: e.target.value })}
                placeholder="Observacoes adicionais"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Logo Preview */}
        {formData.logo && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <Label className="text-sm text-muted-foreground mb-2 block">Pré-visualização do Logo</Label>
            <div className="w-full max-w-xs">
              <AspectRatio ratio={3 / 1}>
                <ImageWithFallback
                  src={formData.logo}
                  alt="Pré-visualização do logo"
                  className="h-full w-full object-contain"
                />
              </AspectRatio>
            </div>
          </div>
        )}

        <Button onClick={handleSave} disabled={isSaving || isLoading} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
          <Save className="h-4 w-4" />
          {isLoading ? 'Carregando...' : isSaving ? 'Salvando...' : 'Salvar Dados Institucionais'}
        </Button>
      </CardContent>
    </Card>
  );
}
