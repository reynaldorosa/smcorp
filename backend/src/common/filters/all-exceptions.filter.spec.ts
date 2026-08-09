import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { TenantContextService } from '../services/tenant-context.service';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let tenantContext: TenantContextService;

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  const mockRequest = {
    method: 'GET',
    url: '/students',
    user: { sub: 'user-1' },
  };

  const mockHost = {
    switchToHttp: () => ({
      getResponse: () => mockResponse,
      getRequest: () => mockRequest,
    }),
  } as unknown as ArgumentsHost;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllExceptionsFilter,
        {
          provide: TenantContextService,
          useValue: { get: jest.fn(() => ({ tenantId: 'tenant-abc' })) },
        },
      ],
    }).compile();

    filter = module.get<AllExceptionsFilter>(AllExceptionsFilter);
    tenantContext = module.get<TenantContextService>(TenantContextService);
  });

  it('loga erro 5xx com stack e contexto (tenantId + rota + userId)', () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const error = new Error('falha no RLS');

    filter.catch(error, mockHost);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('route=GET /students tenantId=tenant-abc userId=user-1'),
      expect.stringContaining('falha no RLS'),
    );
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 500 }));
    errorSpy.mockRestore();
  });

  it('loga 4xx como warn curto, sem stack, e mantém a resposta do HttpException', () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const httpError = new HttpException(
      { statusCode: HttpStatus.FORBIDDEN, message: 'Acesso negado' },
      HttpStatus.FORBIDDEN,
    );

    filter.catch(httpError, mockHost);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('-> 403'));
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    warnSpy.mockRestore();
  });

  it('marca plataforma quando não há tenantId no contexto', () => {
    (tenantContext.get as jest.Mock).mockReturnValue({});
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    filter.catch(new Error('x'), mockHost);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('tenantId=plataforma'),
      expect.any(String),
    );
    errorSpy.mockRestore();
  });
});
