import MockAdapter from "axios-mock-adapter";
import { api } from "../api";
import { getRoleById, getAllRoles, updateRoleAllowedActions } from "../role";

const apiMockRole = new MockAdapter(api.role);

describe("Teste para a função getRoleById", () => {
  afterEach(() => {
    apiMockRole.reset();
  });

  it("Sucesso getRoleById", async () => {
    const roleData = { id: 1, name: "Admin" };
    apiMockRole.onGet("/roleAdmins/1").reply(200, roleData);

    const result = await getRoleById(1);

    expect(result).toEqual({
      type: "success",
      value: roleData,
    });
  });

  it("Erro getRoleById", async () => {
    apiMockRole.onGet("/roleAdmins/2").reply(500);

    const result = await getRoleById(2);

    expect(result.type).toBe("error");
    expect(result.value).toBeUndefined();
  });
});

describe("getAllRoles", () => {
  it("Deve retornar todos os cargos", async () => {
    const mockRolesData = [
      { id: 3, name: "Diretor" },
      { id: 1, name: "Estagiário" },
      { id: 4, name: "Juiz" },
      { id: 5, name: "Administrador" },
      { id: 2, name: "Servidor" },
    ];

    const orderedMockRolesData = [
      { id: 1, name: "Estagiário" },
      { id: 2, name: "Servidor" },
      { id: 3, name: "Diretor" },
      { id: 4, name: "Juiz" },
      { id: 5, name: "Administrador" },
    ];

    apiMockRole.onGet("/").reply(200, mockRolesData);

    const result = await getAllRoles();

    expect(result).toEqual({
      type: "success",
      value: orderedMockRolesData,
    });
  });

  it("Erro getAllRoles", async () => {
    apiMockRole.onGet("/").reply(500);

    const result = await getAllRoles();

    expect(result.type).toBe("error");
    expect(result.value).toBeUndefined();
  });
});

describe("updateRoleAllowedActions", () => {
  it("deve atualizar as ações permitidas de um cargo em caso de sucesso", async () => {
    const idRole = 1;
    const allowedActions = ["action1", "action2"];

    const mockRoleData = {
      id: idRole,
      name: "Admin",
      allowedActions,
    };

    apiMockRole.onPut(`/updateRole/${idRole}`).reply(200, mockRoleData);

    const resultado = await updateRoleAllowedActions({
      idRole,
      allowedActions,
    });

    expect(resultado).toEqual({
      type: "success",
      value: mockRoleData,
    });
  });

  it("deve tratar um erro durante a atualização das ações permitidas", async () => {
    const idRole = 1;
    const allowedActions = ["action1", "action2"];

    apiMockRole.onPut(`/updateRole/${idRole}`).reply(500);

    const resultado = await updateRoleAllowedActions({
      idRole,
      allowedActions,
    });

    expect(resultado.type).toBe("error");
    expect(resultado.value).toBeUndefined();
  });
});
