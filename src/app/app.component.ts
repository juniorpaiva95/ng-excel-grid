import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ExcelGridComponent } from './excel-grid/excel-grid.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ExcelGridComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'ag-excel';

  columnDefs = [
    { headerName: 'Garantidores', field: 'garantidores' },
    { headerName: 'Matrícula', field: 'matricula' },
    { headerName: 'RGI', field: 'rgi' },
    { headerName: 'Descrição', field: 'descricao' },
    { headerName: 'Fração Ideal', field: 'fracao_ideal' },
    { headerName: '% Garantido', field: 'percent_garantido' },
    { headerName: 'Valor Mercado (Laudo)', field: 'valor_laudo' },
    { headerName: 'Valor AF (Contrato)', field: 'valor_af' },
    { headerName: 'Zona do Imóvel', field: 'zona_imovel' },
    { headerName: 'Georreferenciamento', field: 'georreferenciamento' },
    { headerName: 'Tipo', field: 'tipo' },
    { headerName: 'Cidade', field: 'cidade' },
  ];

  rowData = [
    {
      garantidores: 'Teste S/A',
      matricula: '12312',
      rgi: '35265',
      descricao: 'Imóvel na Rua Tal',
      fracao_ideal: '50%',
      percent_garantido: '50%',
      valor_laudo: 'R$ 500.000,00',
      valor_af: 'R$ 500.000,00',
      zona_imovel: 'Imóvel Urbano',
      georreferenciamento: 'Sim',
      tipo: 'Casa',
      cidade: 'João Pessoa - PB',
    },
    {
      garantidores: 'Empresa ABC',
      matricula: '45678',
      rgi: '98765',
      descricao: 'Apartamento na Av. Principal',
      fracao_ideal: '30%',
      percent_garantido: '70%',
      valor_laudo: 'R$ 300.000,00',
      valor_af: 'R$ 280.000,00',
      zona_imovel: 'Imóvel Urbano',
      georreferenciamento: 'Sim',
      tipo: 'Apartamento',
      cidade: 'Recife - PE',
    },
    {
      garantidores: 'Imobiliária XYZ',
      matricula: '78901',
      rgi: '45632',
      descricao: 'Terreno para construção',
      fracao_ideal: '70%',
      percent_garantido: '80%',
      valor_laudo: 'R$ 700.000,00',
      valor_af: 'R$ 650.000,00',
      zona_imovel: 'Terreno Urbano',
      georreferenciamento: 'Sim',
      tipo: 'Terreno',
      cidade: 'São Paulo - SP',
    },
    {
      garantidores: 'Construtora 123',
      matricula: '54321',
      rgi: '12345',
      descricao: 'Casa com piscina',
      fracao_ideal: '40%',
      percent_garantido: '60%',
      valor_laudo: 'R$ 400.000,00',
      valor_af: 'R$ 380.000,00',
      zona_imovel: 'Imóvel Urbano',
      georreferenciamento: 'Sim',
      tipo: 'Casa',
      cidade: 'Rio de Janeiro - RJ',
    },
    {
      garantidores: 'Investimentos LTDA',
      matricula: '24680',
      rgi: '54321',
      descricao: 'Sala Comercial no Centro',
      fracao_ideal: '60%',
      percent_garantido: '70%',
      valor_laudo: 'R$ 600.000,00',
      valor_af: 'R$ 550.000,00',
      zona_imovel: 'Imóvel Comercial',
      georreferenciamento: 'Sim',
      tipo: 'Sala Comercial',
      cidade: 'Curitiba - PR',
    },
  ];
}
