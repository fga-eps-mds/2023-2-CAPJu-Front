import MockAdapter from "axios-mock-adapter";
import {
  importFile,
  findFileById,
  findAllPaged,
  findAllItemsPaged,
  deleteById,
  updateFileItemById,
} from "services/processManagement/processesFile";
import { vi } from "vitest";
import { api } from "../../api";

const apiMock = new MockAdapter(api.processManagement);
const processFileUrl = "processesFile";

describe("Testes para a função importFile", () => {
  afterEach(() => {
    apiMock.reset();
  });

  const mockFile = new File(["conteudo-do-arquivo"], "arquivo.txt", {
    type: "text/plain",
  });
  const data = { file: mockFile, name: "Nome do Arquivo" };

  it("deve importar um arquivo com sucesso", async () => {
    const responseData = { message: "ok" };

    apiMock.onPost("/processesFile/newFile").reply(200, responseData);

    const result = await importFile(data);

    expect(result).toEqual({
      type: "success",
      value: responseData,
    });
  });

  it("deve lidar com erro ao importar um arquivo", async () => {
    apiMock.onPost("/processesFile/newFile").reply(500);

    const result = await importFile(data);

    expect(result).toEqual({
      type: "error",
      error: expect.any(Error),
      value: undefined,
    });
  });

  it("deve enviar o arquivo corretamente", async () => {
    const formDataSpy = vi.spyOn(global, "FormData");

    apiMock.onPost("/processesFile/newFile").reply((config) => {
      const receivedFormData = new FormData(config.data);
      expect(receivedFormData.get("name")).toBe(data.name);
      expect(receivedFormData.get("file")).toEqual(mockFile);

      return [200, {}];
    });

    await importFile(data);

    expect(formDataSpy).toHaveBeenCalled();
  });
});

describe("Testes para a função findFileById", () => {
  afterEach(() => {
    apiMock.reset();
  });

  const idProcessesFile = 123;

  it("deve encontrar o arquivo com sucesso (resulting=false, format=xlsx)", async () => {
    const responseData = { message: "ok" };

    apiMock
      .onGet(
        `/processesFile/findFileById/${idProcessesFile}?original=true&format=xlsx`
      )
      .reply(200, responseData);

    const result = await findFileById(idProcessesFile);

    expect(result).toEqual({
      type: "success",
      value: responseData,
    });
  });

  it("deve encontrar o arquivo com sucesso (resulting=true, format=pdf)", async () => {
    const responseData = { message: "ok" };

    apiMock
      .onGet(
        `/processesFile/findFileById/${idProcessesFile}?original=false&format=pdf`
      )
      .reply(200, responseData);

    const result = await findFileById(idProcessesFile, true, "pdf");

    expect(result).toEqual({
      type: "success",
      value: responseData,
    });
  });

  it("deve lidar com erro ao encontrar o arquivo", async () => {
    apiMock.onGet(`/processesFile/findFileById/${idProcessesFile}`).reply(500);

    const result = await findFileById(idProcessesFile);

    expect(result).toEqual({
      type: "error",
      error: expect.any(Error),
      value: undefined,
    });
  });
});

describe("Testes para a função findAllPaged", () => {
  afterEach(() => {
    apiMock.reset();
  });

  it("deve obter todos os registros com paginação padrão", async () => {
    const responseData = [
      { id: 1, name: "Arquivo 1" },
      { id: 2, name: "Arquivo 2" },
    ];
    apiMock.onGet(`/${processFileUrl}/findAllPaged`).reply(200, responseData);

    const result = await findAllPaged();

    expect(result).toEqual({
      type: "success",
      value: responseData,
    });
  });

  it("deve lidar com erro ao obter registros", async () => {
    apiMock.onGet(`/${processFileUrl}/findAllPaged`).reply(500);

    const result = await findAllPaged();

    expect(result).toEqual({
      type: "error",
      error: expect.any(Error),
      value: undefined,
    });
  });
});

describe("Testes para a função findAllItemsPaged", () => {
  afterEach(() => {
    apiMock.reset();
  });

  const idProcessesFile = 123;
  const filter = "example";
  const pagination = { offset: 0, limit: 10 };

  it("deve obter itens filtrados com paginação padrão", async () => {
    const responseData = [{ id: 1, name: "Item 1" }];
    apiMock
      .onGet(`/${processFileUrl}/findAllItemsPaged`, {
        params: {
          idProcessesFile,
          filter,
          offset: pagination.offset,
          limit: pagination.limit,
        },
      })
      .reply(200, responseData);

    const result = await findAllItemsPaged(idProcessesFile, filter, pagination);

    expect(result).toEqual({
      type: "success",
      value: responseData,
    });
  });

  it("deve lidar com erro ao obter itens", async () => {
    apiMock
      .onGet(`/${processFileUrl}/findAllItemsPaged`, {
        params: { idProcessesFile },
      })
      .reply(500);

    const result = await findAllItemsPaged(idProcessesFile, "");

    expect(result).toEqual({
      type: "error",
      error: expect.any(Error),
      value: undefined,
    });
  });
});

describe("Testes para a função deleteById", () => {
  afterEach(() => {
    apiMock.reset();
  });

  const idProcessesFile = 123;

  it("deve deletar um arquivo com sucesso", async () => {
    apiMock
      .onDelete(`/${processFileUrl}/deleteFile/${idProcessesFile}`)
      .reply(204);

    const result = await deleteById(idProcessesFile);

    expect(result).toEqual({
      type: "success",
      value: undefined,
    });
  });

  it("deve lidar com erro ao deletar um arquivo", async () => {
    apiMock
      .onDelete(`/${processFileUrl}/deleteFile/${idProcessesFile}`)
      .reply(500);

    const result = await deleteById(idProcessesFile);

    expect(result).toEqual({
      type: "error",
      error: expect.any(Error),
      value: undefined,
    });
  });
});

describe("Testes para a função updateFileItemById", () => {
  afterEach(() => {
    apiMock.reset();
  });

  const idProcessesFileItem = 456;
  const data = {};

  it("deve atualizar um item de arquivo com sucesso", async () => {
    const responseData = 123;
    apiMock
      .onPut(`/${processFileUrl}/updateFileItem/${idProcessesFileItem}`)
      .reply(200, responseData);

    const result = await updateFileItemById(idProcessesFileItem, data);

    expect(result).toEqual({
      type: "success",
      value: responseData,
    });
  });

  it("deve lidar com erro ao atualizar um item de arquivo", async () => {
    apiMock
      .onPut(`/${processFileUrl}/updateFileItem/${idProcessesFileItem}`)
      .reply(500);

    const result = await updateFileItemById(idProcessesFileItem, data);

    expect(result).toEqual({
      type: "error",
      error: expect.any(Error),
      value: undefined,
    });
  });
});
