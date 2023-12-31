import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import jwtDecode from "jwt-decode";

import {
  checkSessionStatus,
  signIn,
  signOut,
  signOutExpiredSession,
} from "services/user";
import { useToast } from "@chakra-ui/react";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import { SessionExpirationModal } from "../pages/User/SessionExpirationModal";

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  // eslint-disable-next-line no-unused-vars
  handleLogin: (credentials: {
    cpf: string;
    password: string;
  }) => Promise<Result<User>>;
  handleLogout: () => void;
  allowLogout: () => boolean;
  checkJwtExpiration: () => void;
  getUserData: () => Promise<Result<User & { allowedActions: string[] }>>;
  validateAuthentication: () => void;
};

const AuthContext = createContext({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isInactivityModalOpen, setIsInactivityModalOpen] =
    useState<boolean>(false);

  const [inactivityModalCounter, setinactivityModalCounter] =
    useState<number>(0);

  const sessionLifespanInSeconds = 20;

  type Interval = ReturnType<typeof setInterval>;

  type Timeout = ReturnType<typeof setTimeout>;

  let inactivityTimer: Timeout;

  let inactivityLogoutTimer: Timeout;

  let jwtExpirationCheckInterval: Interval;

  let jwtPresenceCheckInterval: Interval;

  let sessionStatusInterval: Interval;

  let sessionCheckInterval: Interval;

  const [disableLogout, setDisableLogout] = useState<boolean>(false);

  const toast = useToast();

  const localUser = getUserFromLocalStorageDecoded();

  const [user, setUser] = useState<User | null>(
    localUser?.cpf ? localUser : null
  );

  useEffect(() => {
    if (user) {
      addIntervals();
    }
  }, [user]);

  const handleLogin = useCallback(
    async (credentials: {
      cpf: string;
      password: string;
    }): Promise<Result<User>> => {
      const res = await signIn(credentials);
      if (res.type === "success") {
        localStorage.setItem("@CAPJu:jwt_user", JSON.stringify(res.value));
        setUser(getUserFromLocalStorageDecoded());
        return {
          type: res.type,
          value: getUserFromLocalStorageDecoded(),
        } as Result<User>;
      }
      return {
        type: "error",
        error: res.error,
      } as ResultError;
    },
    []
  );

  async function handleLogout(
    logoutInitiator: string = "userRequested",
    afterFnc = () => {}
  ): Promise<void> {
    const result = await signOut(logoutInitiator);
    reactToLogout(result, afterFnc);
  }

  function allowLogout() {
    return !disableLogout;
  }

  const getUserData = useCallback(async (): Promise<
    Result<User & { allowedActions: string[] }>
  > => {
    if (!user?.cpf) {
      clearLocalUserInfo();
      return {
        type: "error",
        error: new Error("Autenticação inválida."),
        value: undefined,
      };
    }

    return {
      value: { ...user, allowedActions: (user as any).role.allowedActions },
    } as any;
  }, [user]);

  function validateAuthentication() {
    const localStorageUser = getUserFromLocalStorageDecoded();

    if (!localStorageUser.cpf) {
      setUser(null);
      return;
    }

    setUser(localStorageUser);
  }

  function getUserFromLocalStorageDecoded() {
    const jwtToken = localStorage.getItem("@CAPJu:jwt_user") as string;

    if (!jwtToken) return {} as User;

    return getJwtFromLocalStorageDecoded().id as User;
  }

  function clearLocalUserInfo() {
    localStorage.removeItem("@CAPJu:jwt_user");
    localStorage.removeItem("@CAPJu:check_session_flag");
    setUser(null);
  }

  function getJwtFromLocalStorageDecoded() {
    const jwtToken = localStorage.getItem("@CAPJu:jwt_user") as string;

    if (!jwtToken) return "";

    return jwtDecode(JSON.stringify(jwtToken)) as any;
  }

  async function checkJwtExpiration() {
    const currentTimeInSeconds = moment().unix();
    const tokenExpirationTime = getJwtFromLocalStorageDecoded().exp;
    const oneMinuteBeforeExpiration = tokenExpirationTime - 60;
    if (currentTimeInSeconds >= oneMinuteBeforeExpiration) {
      setDisableLogout(true);
      const res = await signOutExpiredSession();
      setDisableLogout(false);
      reactToLogout(res, () => {
        toast({
          id: "token-expired",
          description: "Token expirado. Realize o login novamente.",
          status: "error",
          isClosable: true,
        });
        removeMouseMoveListener();
        clearTimeoutsAndIntervals();
      });
    }
  }

  async function checkSession() {
    setDisableLogout(true);

    const sessionId = getJwtFromLocalStorageDecoded()?.id?.sessionId;

    if (!sessionId) return;

    const result = await checkSessionStatus(sessionId);

    setDisableLogout(false);

    if (result.type === "error") {
      toast({
        id: uuidv4(),
        description:
          result.error.message || "Erro ao verificar status da sessão",
        status: "error",
        isClosable: true,
      });
      return;
    }

    if (!result.value.active) {
      clearLocalUserInfo();
      clearTimeoutsAndIntervals();
      removeMouseMoveListener();
      toast({
        id: "token-expired",
        description: result.value.message || "Sessão encerrada",
        status: "error",
        isClosable: true,
      });
      setTimeout(() => window.location.reload(), 1500);
    }
  }

  function addIntervals() {
    clearTimeoutsAndIntervals();

    jwtExpirationCheckInterval = setInterval(async () => {
      await checkJwtExpiration();
    }, 3000); // Checked every 3s

    sessionStatusInterval = setInterval(
      () => localStorage.setItem("@CAPJu:check_session_flag", "true"),
      60000
    ); // Checked every 1mim

    sessionCheckInterval = setInterval(async () => {
      if (localStorage.getItem("@CAPJu:check_session_flag")) {
        localStorage.removeItem("@CAPJu:check_session_flag");
        await checkJwtExpiration();
        await checkSession();
      }
    }, 1000);

    jwtPresenceCheckInterval = setInterval(() => {
      if (!localStorage.getItem("@CAPJu:jwt_user")) {
        clearLocalUserInfo();
        clearTimeoutsAndIntervals();
        window.location.reload();
      }
    }, 50);

    document.addEventListener("mousemove", handleMouseMove);
  }

  function reactToLogout(result: Result<string>, afterFnc = () => {}) {
    const { type } = result;
    if (type === "success") {
      clearInterval(jwtExpirationCheckInterval);
      clearLocalUserInfo();
      clearTimeoutsAndIntervals();
      afterFnc();
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast({
        id: "logou-user-error",
        title: "Erro ao realizar logout",
        status: "error",
        isClosable: true,
      });
    }
  }

  const handleMouseMove = () => {
    setIsInactivityModalOpen(false);
    clearTimeout(inactivityTimer);
    clearTimeout(inactivityLogoutTimer);
    inactivityTimer = setTimeout(() => {
      setinactivityModalCounter(sessionLifespanInSeconds);
      setIsInactivityModalOpen(true);
      inactivityLogoutTimer = setTimeout(async () => {
        await handleLogout("timeoutDueToInactivity", () => {
          toast({
            id: "session-expired",
            description: "Sessão encerrada por inatividade.",
            status: "error",
            isClosable: true,
          });
        });
        setIsInactivityModalOpen(false);
        removeMouseMoveListener();
        clearTimeoutsAndIntervals();
      }, sessionLifespanInSeconds * 1000);
    }, 60 * 5 * 1000); // Checked every 5min
  };

  const clearTimeoutsAndIntervals = () => {
    clearTimeout(inactivityTimer);
    clearTimeout(inactivityLogoutTimer);
    clearInterval(jwtExpirationCheckInterval);
    clearInterval(sessionStatusInterval);
    clearInterval(sessionCheckInterval);
    clearInterval(jwtPresenceCheckInterval);
  };

  const removeMouseMoveListener = () =>
    document.removeEventListener("mousemove", handleMouseMove);

  useEffect(() => {
    validateAuthentication();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        handleLogin,
        checkJwtExpiration,
        handleLogout,
        allowLogout,
        getUserData,
        validateAuthentication,
      }}
    >
      <SessionExpirationModal
        isOpen={isInactivityModalOpen}
        initialCountdown={inactivityModalCounter}
        onClose={() => {}}
      />
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}

/*
Hi, my name is Nicholas and I was mentally abused by an incompetent and
narcissistic professor, the kind who extorts students for grades. Imagine how
absurd it would be for a medical professor to propose a hernia surgery on
his own mother as an experimental class, linking the student's success in
the operation to their academic approval. By using this code or maintaining it,
know that you are endorsing the lack of ethics of this so-called academic.
Contact their superior and discard it immediately.
*/
