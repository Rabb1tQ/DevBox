<template>
  <div class="hash-analyzer">
    <a-card class="mb-4">
      <a-row :gutter="16">
        <a-col :span="24">
          <a-form layout="vertical">
            <a-form-item label="输入十六进制值（每行一个）">
              <a-textarea
                v-model:value="hexInput"
                :rows="6"
                placeholder="输入十六进制值，如：&#10;0x1234abcd&#10;0xdeadbeef&#10;1a2b3c4d"
              />
            </a-form-item>
            
            <a-form-item label="自定义API列表文件（可选）">
              <a-space>
                <a-upload
                  :before-upload="handleFileUpload"
                  :show-upload-list="false"
                  accept=".txt,.lst"
                >
                  <a-button>
                    <UploadOutlined />
                    上传API列表文件
                  </a-button>
                </a-upload>
                <a-button type="primary" @click="analyzeHashes" :loading="analyzing">
                  <SearchOutlined />
                  分析
                </a-button>
                <a-button @click="clearResults">
                  <ClearOutlined />
                  清除结果
                </a-button>
                <a-button @click="copyResults" :disabled="!results">
                  <CopyOutlined />
                  复制结果
                </a-button>
                <a-button @click="showHelpModal">
                  <QuestionCircleOutlined />
                  帮助
                </a-button>
              </a-space>
              <div v-if="customApiList.length > 0" class="mt-2">
                <a-tag color="green">已加载 {{ customApiList.length }} 个自定义API</a-tag>
                <a-button type="link" size="small" @click="clearCustomApi">清除</a-button>
              </div>
            </a-form-item>
          </a-form>
        </a-col>
      </a-row>
    </a-card>

    <a-card v-if="results" title="分析结果" class="results-card">
      <div v-for="(result, index) in parsedResults" :key="index" class="result-item">
        <a-card size="small" class="single-result">
          <a-descriptions :column="1" size="small" bordered>
            <a-descriptions-item label="十六进制">{{ result.hex }}</a-descriptions-item>
            <a-descriptions-item label="十进制">{{ result.decimal }}</a-descriptions-item>
            <a-descriptions-item label="二进制">
              <code class="binary-code">{{ result.binary }}</code>
            </a-descriptions-item>
            <a-descriptions-item label="字节序列 (大端)">
              <a-tag color="blue">[{{ result.bytesBE.join(', ') }}]</a-tag>
              <span class="ml-2">ASCII: "{{ result.asciiBE }}"</span>
              <span class="ml-2">UTF-8: "{{ result.utf8BE }}"</span>
            </a-descriptions-item>
            <a-descriptions-item label="字节序列 (小端)">
              <a-tag color="green">[{{ result.bytesLE.join(', ') }}]</a-tag>
              <span class="ml-2">ASCII: "{{ result.asciiLE }}"</span>
              <span class="ml-2">UTF-8: "{{ result.utf8LE }}"</span>
            </a-descriptions-item>
            <a-descriptions-item label="匹配结果">
              <div v-if="result.matches && result.matches.length > 0" class="match-results">
                <span v-for="(match, matchIndex) in result.matches" :key="matchIndex" class="match-item">
                  <a-tag :color="getAlgorithmColor(match.algo)" size="small">{{ match.algo }}</a-tag>
                  <span class="match-type">
                    <a-tag v-if="match.type === 'Exact'" color="success" size="small">精确</a-tag>
                    <a-tag v-else color="warning" size="small">近似({{ match.diff > 0 ? '+' : '' }}{{ match.diff }})</a-tag>
                  </span>
                  <code class="api-code">{{ match.api }}</code>
                  <span v-if="matchIndex < result.matches.length - 1" class="separator"> | </span>
                </span>
              </div>
              <span v-else class="no-match">未匹配到已知 API 哈希或字符串</span>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </div>
    </a-card>

    <!-- 帮助信息弹窗 -->
    <a-modal
      v-model:visible="helpModalVisible"
      title="哈希分析器帮助"
      :footer="null"
      width="600px"
    >
      <div class="help-content">
        <h4>支持的哈希算法：</h4>
        <ul class="algorithm-list">
          <li><a-tag color="red" size="small">ROR13</a-tag> Metasploit/Cobalt Strike常用的API哈希算法</li>
          <li><a-tag color="blue" size="small">CRC32</a-tag> 循环冗余校验算法</li>
          <li><a-tag color="green" size="small">DJB2</a-tag> Daniel J. Bernstein哈希算法</li>
          <li><a-tag color="orange" size="small">Jenkins</a-tag> Jenkins one-at-a-time哈希算法</li>
        </ul>
        
        <h4>使用方法：</h4>
        <ol class="usage-steps">
          <li>在输入框中输入十六进制值（支持0x前缀），每行一个</li>
          <li>可选择上传自定义API列表文件（.txt或.lst格式）</li>
          <li>点击"分析"按钮获得匹配结果</li>
          <li>结果显示各种进制转换和可能的API匹配</li>
        </ol>
        
        <h4>匹配类型：</h4>
        <ul class="match-types">
          <li><a-tag color="success" size="small">精确</a-tag> 哈希值完全匹配</li>
          <li><a-tag color="warning" size="small">近似</a-tag> 哈希值差值在±2以内</li>
        </ul>
        
        <a-alert type="info" show-icon style="margin-top: 16px;">
          <template #message>
            <span>内置了100+个常用Windows API，包括kernel32.dll、user32.dll、advapi32.dll等模块的常见函数。</span>
          </template>
        </a-alert>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { 
  QuestionCircleOutlined, 
  UploadOutlined, 
  SearchOutlined, 
  ClearOutlined, 
  CopyOutlined 
} from '@ant-design/icons-vue'

export default {
  name: 'HashAnalyzer',
  components: {
    QuestionCircleOutlined,
    UploadOutlined,
    SearchOutlined,
    ClearOutlined,
    CopyOutlined
  },
  setup() {
    const hexInput = ref('')
    const results = ref('')
    const analyzing = ref(false)
    const customApiList = ref([])
    const parsedResults = ref([])
    const rawResults = ref('')
    const helpModalVisible = ref(false)

    // 内置API字典 - 恶意软件常用API
    const builtinApiList = [
      // ========== kernel32.dll - 基础系统API ==========
      // 内存管理
      "kernel32.dll!VirtualAlloc",
      "kernel32.dll!VirtualAllocEx",
      "kernel32.dll!VirtualProtect",
      "kernel32.dll!VirtualProtectEx",
      "kernel32.dll!VirtualFree",
      "kernel32.dll!VirtualFreeEx",
      "kernel32.dll!VirtualQuery",
      "kernel32.dll!VirtualQueryEx",
      "kernel32.dll!HeapAlloc",
      "kernel32.dll!HeapFree",
      "kernel32.dll!HeapCreate",
      "kernel32.dll!HeapDestroy",
      "kernel32.dll!GlobalAlloc",
      "kernel32.dll!GlobalFree",
      "kernel32.dll!LocalAlloc",
      "kernel32.dll!LocalFree",
      
      // 进程和线程操作
      "kernel32.dll!CreateProcessA",
      "kernel32.dll!CreateProcessW",
      "kernel32.dll!CreateProcessAsUserA",
      "kernel32.dll!CreateProcessAsUserW",
      "kernel32.dll!OpenProcess",
      "kernel32.dll!TerminateProcess",
      "kernel32.dll!ExitProcess",
      "kernel32.dll!GetCurrentProcess",
      "kernel32.dll!GetCurrentProcessId",
      "kernel32.dll!GetProcessId",
      "kernel32.dll!CreateThread",
      "kernel32.dll!CreateRemoteThread",
      "kernel32.dll!CreateRemoteThreadEx",
      "kernel32.dll!OpenThread",
      "kernel32.dll!GetCurrentThread",
      "kernel32.dll!GetCurrentThreadId",
      "kernel32.dll!GetThreadId",
      "kernel32.dll!SuspendThread",
      "kernel32.dll!ResumeThread",
      "kernel32.dll!TerminateThread",
      "kernel32.dll!SetThreadContext",
      "kernel32.dll!GetThreadContext",
      "kernel32.dll!WaitForSingleObject",
      "kernel32.dll!WaitForMultipleObjects",
      
      // 模块和库操作
      "kernel32.dll!LoadLibraryA",
      "kernel32.dll!LoadLibraryW",
      "kernel32.dll!LoadLibraryExA",
      "kernel32.dll!LoadLibraryExW",
      "kernel32.dll!FreeLibrary",
      "kernel32.dll!GetModuleHandleA",
      "kernel32.dll!GetModuleHandleW",
      "kernel32.dll!GetModuleHandleExA",
      "kernel32.dll!GetModuleHandleExW",
      "kernel32.dll!GetModuleFileNameA",
      "kernel32.dll!GetModuleFileNameW",
      "kernel32.dll!GetProcAddress",
      
      // 文件操作
      "kernel32.dll!CreateFileA",
      "kernel32.dll!CreateFileW",
      "kernel32.dll!ReadFile",
      "kernel32.dll!WriteFile",
      "kernel32.dll!CloseHandle",
      "kernel32.dll!SetFilePointer",
      "kernel32.dll!SetFilePointerEx",
      "kernel32.dll!SetEndOfFile",
      "kernel32.dll!DeleteFileA",
      "kernel32.dll!DeleteFileW",
      "kernel32.dll!MoveFileA",
      "kernel32.dll!MoveFileW",
      "kernel32.dll!CopyFileA",
      "kernel32.dll!CopyFileW",
      "kernel32.dll!GetFileSize",
      "kernel32.dll!GetFileSizeEx",
      "kernel32.dll!GetFileAttributesA",
      "kernel32.dll!GetFileAttributesW",
      "kernel32.dll!SetFileAttributesA",
      "kernel32.dll!SetFileAttributesW",
      "kernel32.dll!CreateDirectoryA",
      "kernel32.dll!CreateDirectoryW",
      "kernel32.dll!RemoveDirectoryA",
      "kernel32.dll!RemoveDirectoryW",
      "kernel32.dll!FindFirstFileA",
      "kernel32.dll!FindFirstFileW",
      "kernel32.dll!FindNextFileA",
      "kernel32.dll!FindNextFileW",
      "kernel32.dll!FindClose",
      
      // 系统信息
      "kernel32.dll!GetSystemInfo",
      "kernel32.dll!GetNativeSystemInfo",
      "kernel32.dll!GetVersion",
      "kernel32.dll!GetVersionExA",
      "kernel32.dll!GetVersionExW",
      "kernel32.dll!GetComputerNameA",
      "kernel32.dll!GetComputerNameW",
      "kernel32.dll!GetUserNameA",
      "kernel32.dll!GetUserNameW",
      "kernel32.dll!GetTickCount",
      "kernel32.dll!GetTickCount64",
      "kernel32.dll!QueryPerformanceCounter",
      
      // 环境变量和路径
      "kernel32.dll!GetEnvironmentVariableA",
      "kernel32.dll!GetEnvironmentVariableW",
      "kernel32.dll!SetEnvironmentVariableA",
      "kernel32.dll!SetEnvironmentVariableW",
      "kernel32.dll!GetEnvironmentStrings",
      "kernel32.dll!FreeEnvironmentStringsA",
      "kernel32.dll!FreeEnvironmentStringsW",
      "kernel32.dll!GetSystemDirectoryA",
      "kernel32.dll!GetSystemDirectoryW",
      "kernel32.dll!GetWindowsDirectoryA",
      "kernel32.dll!GetWindowsDirectoryW",
      "kernel32.dll!GetTempPathA",
      "kernel32.dll!GetTempPathW",
      "kernel32.dll!GetTempFileNameA",
      "kernel32.dll!GetTempFileNameW",
      
      // 进程内存操作
      "kernel32.dll!ReadProcessMemory",
      "kernel32.dll!WriteProcessMemory",
      "kernel32.dll!FlushInstructionCache",
      
      // 其他重要API
      "kernel32.dll!Sleep",
      "kernel32.dll!GetLastError",
      "kernel32.dll!SetLastError",
      "kernel32.dll!GetCommandLineA",
      "kernel32.dll!GetCommandLineW",
      "kernel32.dll!GetStartupInfoA",
      "kernel32.dll!GetStartupInfoW",
      "kernel32.dll!GetStdHandle",
      "kernel32.dll!SetStdHandle",
      "kernel32.dll!WriteConsoleA",
      "kernel32.dll!WriteConsoleW",
      "kernel32.dll!ReadConsoleA",
      "kernel32.dll!ReadConsoleW",
      "kernel32.dll!WinExec",
      "kernel32.dll!CreateToolhelp32Snapshot",
      "kernel32.dll!Thread32First",
      "kernel32.dll!Thread32Next",
      "kernel32.dll!Process32First",
      "kernel32.dll!Process32Next",
      "kernel32.dll!Module32First",
      "kernel32.dll!Module32Next",
      
      // ========== user32.dll - 用户界面API ==========
      "user32.dll!MessageBoxA",
      "user32.dll!MessageBoxW",
      "user32.dll!FindWindowA",
      "user32.dll!FindWindowW",
      "user32.dll!FindWindowExA",
      "user32.dll!FindWindowExW",
      "user32.dll!EnumWindows",
      "user32.dll!EnumWindowsProc",
      "user32.dll!GetDesktopWindow",
      "user32.dll!GetForegroundWindow",
      "user32.dll!SetForegroundWindow",
      "user32.dll!ShowWindow",
      "user32.dll!GetWindowTextA",
      "user32.dll!GetWindowTextW",
      "user32.dll!SetWindowTextA",
      "user32.dll!SetWindowTextW",
      "user32.dll!SendMessageA",
      "user32.dll!SendMessageW",
      "user32.dll!PostMessageA",
      "user32.dll!PostMessageW",
      "user32.dll!GetMessageA",
      "user32.dll!GetMessageW",
      "user32.dll!DispatchMessageA",
      "user32.dll!DispatchMessageW",
      "user32.dll!TranslateMessage",
      "user32.dll!RegisterClassA",
      "user32.dll!RegisterClassW",
      "user32.dll!CreateWindowExA",
      "user32.dll!CreateWindowExW",
      "user32.dll!DestroyWindow",
      "user32.dll!DefWindowProcA",
      "user32.dll!DefWindowProcW",
      "user32.dll!GetWindowRect",
      "user32.dll!SetWindowPos",
      "user32.dll!GetClientRect",
      "user32.dll!GetDC",
      "user32.dll!ReleaseDC",
      "user32.dll!RegisterHotKey",
      "user32.dll!UnregisterHotKey",
      "user32.dll!SetWindowsHookExA",
      "user32.dll!SetWindowsHookExW",
      "user32.dll!UnhookWindowsHookEx",
      "user32.dll!CallNextHookEx",
      "user32.dll!GetKeyState",
      "user32.dll!GetAsyncKeyState",
      "user32.dll!keybd_event",
      "user32.dll!mouse_event",
      
      // ========== advapi32.dll - 注册表和安全API ==========
      // 注册表操作
      "advapi32.dll!RegOpenKeyA",
      "advapi32.dll!RegOpenKeyW",
      "advapi32.dll!RegOpenKeyExA",
      "advapi32.dll!RegOpenKeyExW",
      "advapi32.dll!RegCreateKeyA",
      "advapi32.dll!RegCreateKeyW",
      "advapi32.dll!RegCreateKeyExA",
      "advapi32.dll!RegCreateKeyExW",
      "advapi32.dll!RegCloseKey",
      "advapi32.dll!RegSetValueA",
      "advapi32.dll!RegSetValueW",
      "advapi32.dll!RegSetValueExA",
      "advapi32.dll!RegSetValueExW",
      "advapi32.dll!RegQueryValueA",
      "advapi32.dll!RegQueryValueW",
      "advapi32.dll!RegQueryValueExA",
      "advapi32.dll!RegQueryValueExW",
      "advapi32.dll!RegDeleteKeyA",
      "advapi32.dll!RegDeleteKeyW",
      "advapi32.dll!RegDeleteValueA",
      "advapi32.dll!RegDeleteValueW",
      "advapi32.dll!RegEnumKeyA",
      "advapi32.dll!RegEnumKeyW",
      "advapi32.dll!RegEnumKeyExA",
      "advapi32.dll!RegEnumKeyExW",
      "advapi32.dll!RegEnumValueA",
      "advapi32.dll!RegEnumValueW",
      
      // 服务管理
      "advapi32.dll!OpenServiceA",
      "advapi32.dll!OpenServiceW",
      "advapi32.dll!CreateServiceA",
      "advapi32.dll!CreateServiceW",
      "advapi32.dll!DeleteService",
      "advapi32.dll!StartServiceA",
      "advapi32.dll!StartServiceW",
      "advapi32.dll!ControlService",
      "advapi32.dll!OpenSCManagerA",
      "advapi32.dll!OpenSCManagerW",
      "advapi32.dll!CloseServiceHandle",
      "advapi32.dll!QueryServiceStatus",
      "advapi32.dll!QueryServiceStatusEx",
      "advapi32.dll!EnumServicesStatusA",
      "advapi32.dll!EnumServicesStatusW",
      
      // 安全和权限
      "advapi32.dll!OpenProcessToken",
      "advapi32.dll!OpenThreadToken",
      "advapi32.dll!GetTokenInformation",
      "advapi32.dll!SetTokenInformation",
      "advapi32.dll!LookupPrivilegeValueA",
      "advapi32.dll!LookupPrivilegeValueW",
      "advapi32.dll!AdjustTokenPrivileges",
      "advapi32.dll!DuplicateToken",
      "advapi32.dll!DuplicateTokenEx",
      "advapi32.dll!ImpersonateLoggedOnUser",
      "advapi32.dll!RevertToSelf",
      "advapi32.dll!LogonUserA",
      "advapi32.dll!LogonUserW",
      "advapi32.dll!CreateProcessAsUserA",
      "advapi32.dll!CreateProcessAsUserW",
      "advapi32.dll!CreateProcessWithLogonW",
      "advapi32.dll!CreateProcessWithTokenW",
      
      // 加密API
      "advapi32.dll!CryptAcquireContextA",
      "advapi32.dll!CryptAcquireContextW",
      "advapi32.dll!CryptReleaseContext",
      "advapi32.dll!CryptCreateHash",
      "advapi32.dll!CryptHashData",
      "advapi32.dll!CryptGetHashParam",
      "advapi32.dll!CryptDestroyHash",
      "advapi32.dll!CryptGenKey",
      "advapi32.dll!CryptImportKey",
      "advapi32.dll!CryptExportKey",
      "advapi32.dll!CryptEncrypt",
      "advapi32.dll!CryptDecrypt",
      "advapi32.dll!CryptDestroyKey",
      
      // ========== ntdll.dll - 原生API ==========
      "ntdll.dll!NtQueryInformationProcess",
      "ntdll.dll!NtSetInformationProcess",
      "ntdll.dll!NtQuerySystemInformation",
      "ntdll.dll!NtReadVirtualMemory",
      "ntdll.dll!NtWriteVirtualMemory",
      "ntdll.dll!NtAllocateVirtualMemory",
      "ntdll.dll!NtFreeVirtualMemory",
      "ntdll.dll!NtProtectVirtualMemory",
      "ntdll.dll!NtOpenProcess",
      "ntdll.dll!NtOpenThread",
      "ntdll.dll!NtCreateProcess",
      "ntdll.dll!NtCreateProcessEx",
      "ntdll.dll!NtCreateThread",
      "ntdll.dll!NtCreateThreadEx",
      "ntdll.dll!NtTerminateProcess",
      "ntdll.dll!NtTerminateThread",
      "ntdll.dll!NtSuspendProcess",
      "ntdll.dll!NtResumeProcess",
      "ntdll.dll!NtSuspendThread",
      "ntdll.dll!NtResumeThread",
      "ntdll.dll!NtClose",
      "ntdll.dll!NtCreateFile",
      "ntdll.dll!NtReadFile",
      "ntdll.dll!NtWriteFile",
      "ntdll.dll!NtDeviceIoControlFile",
      "ntdll.dll!NtFsControlFile",
      "ntdll.dll!NtQueryInformationFile",
      "ntdll.dll!NtSetInformationFile",
      "ntdll.dll!NtCreateSection",
      "ntdll.dll!NtMapViewOfSection",
      "ntdll.dll!NtUnmapViewOfSection",
      "ntdll.dll!NtOpenSection",
      "ntdll.dll!NtQuerySection",
      "ntdll.dll!NtDelayExecution",
      "ntdll.dll!NtYieldExecution",
      "ntdll.dll!NtGetContextThread",
      "ntdll.dll!NtSetContextThread",
      "ntdll.dll!NtQueueApcThread",
      "ntdll.dll!NtTestAlert",
      "ntdll.dll!NtOpenDirectoryObject",
      "ntdll.dll!NtQueryDirectoryObject",
      "ntdll.dll!NtOpenSymbolicLinkObject",
      "ntdll.dll!NtQuerySymbolicLinkObject",
      "ntdll.dll!RtlCreateUserThread",
      "ntdll.dll!RtlExitUserThread",
      "ntdll.dll!LdrLoadDll",
      "ntdll.dll!LdrUnloadDll",
      "ntdll.dll!LdrGetProcedureAddress",
      "ntdll.dll!LdrGetDllHandle",
      "ntdll.dll!RtlInitUnicodeString",
      "ntdll.dll!RtlCreateUnicodeString",
      "ntdll.dll!RtlFreeUnicodeString",
      "ntdll.dll!RtlAnsiStringToUnicodeString",
      "ntdll.dll!RtlUnicodeStringToAnsiString",
      
      // ========== ws2_32.dll - 网络API ==========
      "ws2_32.dll!WSAStartup",
      "ws2_32.dll!WSACleanup",
      "ws2_32.dll!WSASocketA",
      "ws2_32.dll!WSASocketW",
      "ws2_32.dll!socket",
      "ws2_32.dll!bind",
      "ws2_32.dll!listen",
      "ws2_32.dll!accept",
      "ws2_32.dll!connect",
      "ws2_32.dll!send",
      "ws2_32.dll!recv",
      "ws2_32.dll!sendto",
      "ws2_32.dll!recvfrom",
      "ws2_32.dll!closesocket",
      "ws2_32.dll!shutdown",
      "ws2_32.dll!setsockopt",
      "ws2_32.dll!getsockopt",
      "ws2_32.dll!gethostname",
      "ws2_32.dll!gethostbyname",
      "ws2_32.dll!gethostbyaddr",
      "ws2_32.dll!getservbyname",
      "ws2_32.dll!getservbyport",
      "ws2_32.dll!inet_addr",
      "ws2_32.dll!inet_ntoa",
      "ws2_32.dll!htons",
      "ws2_32.dll!htonl",
      "ws2_32.dll!ntohs",
      "ws2_32.dll!ntohl",
      "ws2_32.dll!select",
      "ws2_32.dll!ioctlsocket",
      "ws2_32.dll!WSAGetLastError",
      "ws2_32.dll!WSASetLastError",
      "ws2_32.dll!WSAEventSelect",
      "ws2_32.dll!WSACreateEvent",
      "ws2_32.dll!WSACloseEvent",
      "ws2_32.dll!WSAWaitForMultipleEvents",
      "ws2_32.dll!WSAEnumNetworkEvents",
      
      // ========== wininet.dll - 互联网API ==========
      "wininet.dll!InternetOpenA",
      "wininet.dll!InternetOpenW",
      "wininet.dll!InternetCloseHandle",
      "wininet.dll!InternetConnectA",
      "wininet.dll!InternetConnectW",
      "wininet.dll!InternetOpenUrlA",
      "wininet.dll!InternetOpenUrlW",
      "wininet.dll!InternetReadFile",
      "wininet.dll!InternetWriteFile",
      "wininet.dll!InternetQueryDataAvailable",
      "wininet.dll!HttpOpenRequestA",
      "wininet.dll!HttpOpenRequestW",
      "wininet.dll!HttpSendRequestA",
      "wininet.dll!HttpSendRequestW",
      "wininet.dll!HttpSendRequestExA",
      "wininet.dll!HttpSendRequestExW",
      "wininet.dll!HttpQueryInfoA",
      "wininet.dll!HttpQueryInfoW",
      "wininet.dll!HttpAddRequestHeadersA",
      "wininet.dll!HttpAddRequestHeadersW",
      "wininet.dll!InternetSetOptionA",
      "wininet.dll!InternetSetOptionW",
      "wininet.dll!InternetQueryOptionA",
      "wininet.dll!InternetQueryOptionW",
      "wininet.dll!FtpOpenFileA",
      "wininet.dll!FtpOpenFileW",
      "wininet.dll!FtpGetFileA",
      "wininet.dll!FtpGetFileW",
      "wininet.dll!FtpPutFileA",
      "wininet.dll!FtpPutFileW",
      "wininet.dll!FtpDeleteFileA",
      "wininet.dll!FtpDeleteFileW",
      "wininet.dll!FtpFindFirstFileA",
      "wininet.dll!FtpFindFirstFileW",
      "wininet.dll!InternetFindNextFileA",
      "wininet.dll!InternetFindNextFileW",
      
      // ========== shell32.dll - Shell API ==========
      "shell32.dll!ShellExecuteA",
      "shell32.dll!ShellExecuteW",
      "shell32.dll!ShellExecuteExA",
      "shell32.dll!ShellExecuteExW",
      "shell32.dll!SHGetSpecialFolderPathA",
      "shell32.dll!SHGetSpecialFolderPathW",
      "shell32.dll!SHGetFolderPathA",
      "shell32.dll!SHGetFolderPathW",
      "shell32.dll!SHGetKnownFolderPath",
      "shell32.dll!SHGetDesktopFolder",
      "shell32.dll!SHBrowseForFolderA",
      "shell32.dll!SHBrowseForFolderW",
      "shell32.dll!SHFileOperationA",
      "shell32.dll!SHFileOperationW",
      "shell32.dll!ShellNotifyIconA",
      "shell32.dll!ShellNotifyIconW",
      "shell32.dll!ExtractIconA",
      "shell32.dll!ExtractIconW",
      "shell32.dll!ExtractIconExA",
      "shell32.dll!ExtractIconExW",
      "shell32.dll!FindExecutableA",
      "shell32.dll!FindExecutableW",
      "shell32.dll!CommandLineToArgvW",
      
      // ========== ole32.dll - COM API ==========
      "ole32.dll!CoInitialize",
      "ole32.dll!CoInitializeEx",
      "ole32.dll!CoUninitialize",
      "ole32.dll!CoCreateInstance",
      "ole32.dll!CoCreateInstanceEx",
      "ole32.dll!CoGetClassObject",
      "ole32.dll!CoFreeLibrary",
      "ole32.dll!CoLoadLibrary",
      "ole32.dll!CoTaskMemAlloc",
      "ole32.dll!CoTaskMemFree",
      "ole32.dll!CreateStreamOnHGlobal",
      "ole32.dll!GetHGlobalFromStream",
      
      // ========== crypt32.dll - 加密API ==========
      "crypt32.dll!CertOpenStore",
      "crypt32.dll!CertCloseStore",
      "crypt32.dll!CertFindCertificateInStore",
      "crypt32.dll!CertFreeCertificateContext",
      "crypt32.dll!CertGetCertificateContextProperty",
      "crypt32.dll!CertSetCertificateContextProperty",
      "crypt32.dll!CryptDecodeObjectEx",
      "crypt32.dll!CryptEncodeObjectEx",
      "crypt32.dll!CryptStringToBinaryA",
      "crypt32.dll!CryptStringToBinaryW",
      "crypt32.dll!CryptBinaryToStringA",
      "crypt32.dll!CryptBinaryToStringW",
      "crypt32.dll!CryptHashCertificate",
      "crypt32.dll!CryptVerifyCertificateSignatureEx",
      
      // ========== psapi.dll - 进程状态API ==========
      "psapi.dll!EnumProcesses",
      "psapi.dll!EnumProcessModules",
      "psapi.dll!EnumProcessModulesEx",
      "psapi.dll!GetModuleBaseNameA",
      "psapi.dll!GetModuleBaseNameW",
      "psapi.dll!GetModuleFileNameExA",
      "psapi.dll!GetModuleFileNameExW",
      "psapi.dll!GetModuleInformation",
      "psapi.dll!GetProcessMemoryInfo",
      "psapi.dll!GetPerformanceInfo",
      "psapi.dll!EnumDeviceDrivers",
      "psapi.dll!GetDeviceDriverBaseNameA",
      "psapi.dll!GetDeviceDriverBaseNameW",
      "psapi.dll!GetDeviceDriverFileNameA",
      "psapi.dll!GetDeviceDriverFileNameW",
      
      // ========== urlmon.dll - URL Moniker API ==========
      "urlmon.dll!URLDownloadToFileA",
      "urlmon.dll!URLDownloadToFileW",
      "urlmon.dll!URLDownloadToCacheFileA",
      "urlmon.dll!URLDownloadToCacheFileW",
      "urlmon.dll!URLOpenStreamA",
      "urlmon.dll!URLOpenStreamW",
      "urlmon.dll!URLOpenBlockingStreamA",
      "urlmon.dll!URLOpenBlockingStreamW",
      "urlmon.dll!CoInternetCreateUrl",
      "urlmon.dll!CoInternetParseUrl",
      
      // ========== shlwapi.dll - Shell轻量级API ==========
      "shlwapi.dll!PathFileExistsA",
      "shlwapi.dll!PathFileExistsW",
      "shlwapi.dll!PathFindFileNameA",
      "shlwapi.dll!PathFindFileNameW",
      "shlwapi.dll!PathFindExtensionA",
      "shlwapi.dll!PathFindExtensionW",
      "shlwapi.dll!PathRemoveFileSpecA",
      "shlwapi.dll!PathRemoveFileSpecW",
      "shlwapi.dll!PathCombineA",
      "shlwapi.dll!PathCombineW",
      "shlwapi.dll!PathAppendA",
      "shlwapi.dll!PathAppendW",
      "shlwapi.dll!PathIsDirectoryA",
      "shlwapi.dll!PathIsDirectoryW",
      "shlwapi.dll!PathIsFileSpecA",
      "shlwapi.dll!PathIsFileSpecW",
      "shlwapi.dll!StrStrA",
      "shlwapi.dll!StrStrW",
      "shlwapi.dll!StrStrIA",
      "shlwapi.dll!StrStrIW",
      "shlwapi.dll!StrCmpA",
      "shlwapi.dll!StrCmpW",
      "shlwapi.dll!StrCmpIA",
      "shlwapi.dll!StrCmpIW",
      
      // ========== dbghelp.dll - 调试帮助API ==========
      "dbghelp.dll!SymInitialize",
      "dbghelp.dll!SymCleanup",
      "dbghelp.dll!SymLoadModule64",
      "dbghelp.dll!SymUnloadModule64",
      "dbghelp.dll!SymGetSymFromAddr64",
      "dbghelp.dll!SymGetLineFromAddr64",
      "dbghelp.dll!StackWalk64",
      "dbghelp.dll!MiniDumpWriteDump",
      "dbghelp.dll!ImageNtHeader",
      "dbghelp.dll!ImageDirectoryEntryToData",
      "dbghelp.dll!ImageRvaToVa",
      
      // ========== version.dll - 版本信息API ==========
      "version.dll!GetFileVersionInfoA",
      "version.dll!GetFileVersionInfoW",
      "version.dll!GetFileVersionInfoSizeA",
      "version.dll!GetFileVersionInfoSizeW",
      "version.dll!VerQueryValueA",
      "version.dll!VerQueryValueW",
      "version.dll!VerLanguageNameA",
      "version.dll!VerLanguageNameW",
      
      // ========== imagehlp.dll - 映像帮助API ==========
      "imagehlp.dll!ImageLoad",
      "imagehlp.dll!ImageUnload",
      "imagehlp.dll!ImageGetDigestStream",
      "imagehlp.dll!ImageGetCertificateData",
      "imagehlp.dll!ImageGetCertificateHeader",
      "imagehlp.dll!MapFileAndCheckSumA",
      "imagehlp.dll!MapFileAndCheckSumW",
      
      // ========== wtsapi32.dll - 终端服务API ==========
      "wtsapi32.dll!WTSEnumerateSessionsA",
      "wtsapi32.dll!WTSEnumerateSessionsW",
      "wtsapi32.dll!WTSQuerySessionInformationA",
      "wtsapi32.dll!WTSQuerySessionInformationW",
      "wtsapi32.dll!WTSFreeMemory",
      "wtsapi32.dll!WTSTerminateProcess",
      "wtsapi32.dll!WTSLogoffSession",
      "wtsapi32.dll!WTSDisconnectSession",
      
      // ========== iphlpapi.dll - IP帮助API ==========
      "iphlpapi.dll!GetAdaptersInfo",
      "iphlpapi.dll!GetAdaptersAddresses",
      "iphlpapi.dll!GetNetworkParams",
      "iphlpapi.dll!GetIpAddrTable",
      "iphlpapi.dll!GetTcpTable",
      "iphlpapi.dll!GetUdpTable",
      "iphlpapi.dll!GetExtendedTcpTable",
      "iphlpapi.dll!GetExtendedUdpTable",
      
      // ========== setupapi.dll - 安装API ==========
      "setupapi.dll!SetupDiGetClassDevsA",
      "setupapi.dll!SetupDiGetClassDevsW",
      "setupapi.dll!SetupDiEnumDeviceInterfaces",
      "setupapi.dll!SetupDiGetDeviceInterfaceDetailA",
      "setupapi.dll!SetupDiGetDeviceInterfaceDetailW",
      "setupapi.dll!SetupDiDestroyDeviceInfoList",
      
      // ========== wmi.dll / ole32.dll - WMI相关 ==========
      "ole32.dll!CoCreateInstance", // 重复但重要
      "oleaut32.dll!SysAllocString",
      "oleaut32.dll!SysFreeString",
      "oleaut32.dll!VariantInit",
      "oleaut32.dll!VariantClear",
      
      // ========== 其他恶意软件常用API ==========
      // 反调试相关
      "kernel32.dll!IsDebuggerPresent",
      "kernel32.dll!CheckRemoteDebuggerPresent",
      "kernel32.dll!OutputDebugStringA",
      "kernel32.dll!OutputDebugStringW",
      "kernel32.dll!SetUnhandledExceptionFilter",
      "kernel32.dll!UnhandledExceptionFilter",
      "ntdll.dll!NtQueryInformationProcess", // 重复但重要
      "ntdll.dll!DbgBreakPoint",
      "ntdll.dll!DbgUserBreakPoint",
      
      // 持久化相关
      "kernel32.dll!SetFileAttributesA", // 重复但重要
      "kernel32.dll!SetFileAttributesW", // 重复但重要
      "advapi32.dll!RegSetValueExA", // 重复但重要
      "advapi32.dll!RegSetValueExW", // 重复但重要
      
      // 网络钓鱼和窃取相关
      "user32.dll!GetWindowTextA", // 重复但重要
      "user32.dll!GetWindowTextW", // 重复但重要
      "user32.dll!GetClassNameA",
      "user32.dll!GetClassNameW",
      "user32.dll!EnumWindows", // 重复但重要
      "user32.dll!SetWindowsHookExA", // 重复但重要
      "user32.dll!SetWindowsHookExW", // 重复但重要
      
      // 提权相关
      "advapi32.dll!LookupPrivilegeValueA", // 重复但重要
      "advapi32.dll!LookupPrivilegeValueW", // 重复但重要
      "advapi32.dll!AdjustTokenPrivileges", // 重复但重要
      "advapi32.dll!OpenProcessToken", // 重复但重要
      
      // Rootkit常用
      "ntdll.dll!ZwSetSystemInformation",
      "ntdll.dll!NtLoadDriver",
      "ntdll.dll!NtUnloadDriver",
      "ntdll.dll!NtSystemDebugControl",
      
      // 代码注入常用
      "kernel32.dll!VirtualAllocEx", // 重复但重要
      "kernel32.dll!WriteProcessMemory", // 重复但重要
      "kernel32.dll!CreateRemoteThread", // 重复但重要
      "ntdll.dll!NtCreateThreadEx", // 重复但重要
      "ntdll.dll!RtlCreateUserThread", // 重复但重要
      "ntdll.dll!NtQueueApcThread", // 重复但重要
      "ntdll.dll!NtMapViewOfSection", // 重复但重要
      "ntdll.dll!NtCreateSection", // 重复但重要
      
      // 进程空心化(Process Hollowing)
      "ntdll.dll!NtUnmapViewOfSection", // 重复但重要
      "kernel32.dll!SetThreadContext", // 重复但重要
      "kernel32.dll!GetThreadContext", // 重复但重要
      "kernel32.dll!ResumeThread", // 重复但重要
      
      // DLL劫持相关
      "kernel32.dll!LoadLibraryA", // 重复但重要
      "kernel32.dll!LoadLibraryW", // 重复但重要
      "kernel32.dll!GetProcAddress", // 重复但重要
      "kernel32.dll!GetModuleHandleA", // 重复但重要
      "kernel32.dll!GetModuleHandleW"  // 重复但重要
    ]

    // 哈希算法实现
    const ror32 = (value, bits) => {
      return ((value >>> bits) | (value << (32 - bits))) >>> 0
    }

    const hashROR13 = (moduleName, funcName) => {
      // 根据reverse.c分析的真实Cobalt Strike算法
      let mhash = 0, fhash = 0
      
      // 计算模块名哈希（转大写）
      if (moduleName) {
        for (let i = 0; i < moduleName.length; i++) {
          let c = moduleName.charCodeAt(i)
          if (c >= 0x61 && c <= 0x7A) { // 小写字母转大写
            c -= 0x20
          }
          mhash = ror32(mhash, 13)  // 先ROR
          mhash = (mhash + c) >>> 0  // 再加字符
        }
      }
      
      // 计算函数名哈希（保持原样）
      for (let i = 0; i < funcName.length; i++) {
        let c = funcName.charCodeAt(i)
        fhash = ror32(fhash, 13)  // 先ROR
        fhash = (fhash + c) >>> 0  // 再加字符
      }
      
      return (mhash + fhash) >>> 0
    }

    const hashDJB2 = (str) => {
      let h = 5381
      for (let i = 0; i < str.length; i++) {
        h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
      }
      return h
    }

    const crcTable = (() => {
      let table = new Uint32Array(256)
      for (let n = 0; n < 256; n++) {
        let c = n
        for (let k = 0; k < 8; k++) {
          c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
        }
        table[n] = c >>> 0
      }
      return table
    })()

    const hashCRC32 = (str) => {
      let crc = 0xFFFFFFFF
      for (let i = 0; i < str.length; i++) {
        let c = str.charCodeAt(i) & 0xFF
        crc = (crc >>> 8) ^ crcTable[(crc ^ c) & 0xFF]
      }
      return (crc ^ 0xFFFFFFFF) >>> 0
    }

    const hashJenkins = (str) => {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        hash += str.charCodeAt(i)
        hash += (hash << 10)
        hash ^= (hash >>> 6)
      }
      hash += (hash << 3)
      hash ^= (hash >>> 11)
      hash += (hash << 15)
      return hash >>> 0
    }

    // 基于reverse.c完整分析的真实CS哈希计算
    function calculateCSHash(moduleName, funcName) {
      // 保存原始模块哈希到var_18h (第12行定义)
      let var_18h = 0
      
      // 计算模块名哈希（转大写，基于reverse.c第33-42行）
      if (moduleName && moduleName.length > 0) {
        var_18h = 0  // 第33行：ecx = 0; 初始化
        for (let i = 0; i < moduleName.length; i++) {
          let c = moduleName.charCodeAt(i)
          // 检查循环终止条件 - 遇到null就停止
          if (c === 0) break
          
          // 转大写（reverse.c第37-39行逻辑：if (al >= 0x61) al -= 0x20）
          if (c >= 0x61) { // >= 'a'
            c -= 0x20
          }
          var_18h = (var_18h + 1) >>> 0  // ecx++ (第40行)
          var_18h = ror32(var_18h, 13)  // rotate_right32 (ecx, 0xd) (第41行)
          var_18h = (var_18h + 1) >>> 0  // ecx++ (第42行)
          var_18h = (var_18h + c) >>> 0  // ecx += eax (第43行)
        }
        // 第44行：模块名哈希完成后的额外递增
        var_18h = (var_18h + 1) >>> 0
      }
      
      // 计算函数名哈希（重新从0开始，基于reverse.c第75-84行）
      let ecx = 0  // 第75行：ecx = 0; 重新初始化为0
      for (let i = 0; i < funcName.length; i++) {
        let c = funcName.charCodeAt(i)
        // 检查循环终止条件 (第84行: while (al != ah))
        if (c === 0) break
        
        ecx = (ecx + 1) >>> 0  // ecx++ (第81行)
        ecx = ror32(ecx, 13)  // rotate_right32 (ecx, 0xd) (第82行)
        ecx = (ecx + 1) >>> 0  // ecx++ (第83行)
        ecx = (ecx + c) >>> 0  // ecx += eax (第84行)
      }
      
      // 组合哈希（reverse.c第86行：ecx += var_18h）
      ecx = (ecx + var_18h) >>> 0
      
      return ecx
    }

    // 分析单个十六进制值
    const analyzeHexValue = (hexValue, apiList) => {
      hexValue = String(hexValue).trim()
      if (hexValue.startsWith("0x") || hexValue.startsWith("0X")) {
        hexValue = hexValue.slice(2)
      }
      
      if (!/^[0-9a-fA-F]+$/.test(hexValue)) {
        return `输入 "${hexValue}" 不是有效的十六进制数。`
      }
      
      if (hexValue.length % 2 !== 0) hexValue = "0" + hexValue
      let num = parseInt(hexValue, 16) >>> 0
      
      // 辅助信息
      let dec = num.toString(10)
      let bin = num.toString(2).padStart(32, '0')
      
      // 字节序列
      let bytes = hexValue.match(/.{2}/g)?.map(b => parseInt(b, 16)) || []
      while (bytes.length < 4) bytes.unshift(0)
      let bytesLE = [...bytes].reverse()
      
      // ASCII解码
      const bytesToString = (barr) => {
        let s = ""
        for (let b of barr) {
          s += (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.'
        }
        return s
      }
      
      let asciiBE = bytesToString(bytes)
      let asciiLE = bytesToString(bytesLE)
      
      let utf8BE, utf8LE
      try {
        utf8BE = new TextDecoder("utf-8").decode(new Uint8Array(bytes))
      } catch { utf8BE = "Invalid UTF-8" }
      try {
        utf8LE = new TextDecoder("utf-8").decode(new Uint8Array(bytesLE))
      } catch { utf8LE = "Invalid UTF-8" }
      
      // 哈希匹配
      let matches = []
      const currentApiList = (apiList && apiList.length) ? apiList : builtinApiList
      
      if (currentApiList && currentApiList.length) {
        for (let apiName of currentApiList) {
          apiName = apiName.trim()
          if (!apiName) continue
          
          // 解析API名称格式
          let [mod, func] = apiName.includes('!') ? apiName.split('!') : apiName.split(/_|:/)
          if (!func) { func = mod; mod = "" }
          func = func || apiName
          
          // 系统性测试所有可能的组合
          testAllHashVariants(mod, func, apiName, num, matches)
        }
      }
      
      // 系统性测试所有哈希变体
      function testAllHashVariants(moduleName, funcName, originalName, targetHash, matchArray) {
        if (!funcName) return
        
        // 1. 测试原始格式
        if (moduleName) {
          testSingleHash(moduleName, funcName, originalName, targetHash, matchArray)
          
          // 2. 测试不带.dll后缀的模块名
          let modNoExt = moduleName.replace('.dll', '')
          if (modNoExt !== moduleName) {
            testSingleHash(modNoExt, funcName, `${modNoExt}!${funcName}`, targetHash, matchArray)
          }
          
          // 3. 测试大写模块名
          testSingleHash(moduleName.toUpperCase(), funcName, `${moduleName.toUpperCase()}!${funcName}`, targetHash, matchArray)
          testSingleHash(modNoExt.toUpperCase(), funcName, `${modNoExt.toUpperCase()}!${funcName}`, targetHash, matchArray)
          
          // 4. 测试小写模块名
          testSingleHash(moduleName.toLowerCase(), funcName, `${moduleName.toLowerCase()}!${funcName}`, targetHash, matchArray)
          testSingleHash(modNoExt.toLowerCase(), funcName, `${modNoExt.toLowerCase()}!${funcName}`, targetHash, matchArray)
        }
        
        // 5. 测试只有函数名（CS常用格式）
        testSingleHash('', funcName, funcName, targetHash, matchArray)
        
        // 6. 测试函数名的大小写变体
        testSingleHash('', funcName.toLowerCase(), `${funcName.toLowerCase()} (lowercase)`, targetHash, matchArray)
        testSingleHash('', funcName.toUpperCase(), `${funcName.toUpperCase()} (uppercase)`, targetHash, matchArray)
      }
      
      // 单个哈希测试
      function testSingleHash(moduleName, funcName, displayName, targetHash, matchArray) {
        // 基于reverse.c的Cobalt Strike ROR13算法
        let hash = calculateCSHash(moduleName, funcName)
        if (hash === targetHash) {
          matchArray.push({ algo: "CS-ROR13", api: displayName, type: "Exact" })
        } else if (Math.abs(hash - targetHash) <= 2) {
          matchArray.push({ algo: "CS-ROR13", api: displayName, type: "Approx", diff: hash - targetHash })
        }
        
        // 测试CS算法的其他可能变体
        testCSVariants(moduleName, funcName, displayName, targetHash, matchArray)
        
        // 标准ROR13测试
        let rorHash = hashROR13(moduleName, funcName)
        if (rorHash === targetHash) {
          matchArray.push({ algo: "ROR13", api: displayName, type: "Exact" })
        } else if (Math.abs(rorHash - targetHash) <= 2) {
          matchArray.push({ algo: "ROR13", api: displayName, type: "Approx", diff: rorHash - targetHash })
        }
        
        // 其他算法测试
        testOtherAlgorithms(displayName, targetHash, matchArray)
      }
      
      // 测试CS算法的各种可能变体
      function testCSVariants(moduleName, funcName, displayName, targetHash, matchArray) {
        // 变体1: 只对函数名计算哈希（基于reverse.c第76-85行）
        let funcOnlyHash = 0
        for (let i = 0; i < funcName.length; i++) {
          let c = funcName.charCodeAt(i)
          funcOnlyHash++;  // ecx++
          funcOnlyHash = ror32(funcOnlyHash, 13)
          funcOnlyHash++;  // ecx++
          funcOnlyHash = (funcOnlyHash + c) >>> 0
        }
        if (funcOnlyHash === targetHash) {
          matchArray.push({ algo: "CS-Func", api: `${funcName} (function only)`, type: "Exact" })
        }
        
        // 变体2: 函数名包含null终止符（基于reverse.c第85行的 al != ah 条件）
        let funcWithNullHash = 0
        let funcWithNull = funcName + '\0'
        for (let i = 0; i < funcWithNull.length; i++) {
          let c = funcWithNull.charCodeAt(i)
          funcWithNullHash++;  // ecx++
          funcWithNullHash = ror32(funcWithNullHash, 13)
          funcWithNullHash++;  // ecx++
          funcWithNullHash = (funcWithNullHash + c) >>> 0
        }
        if (funcWithNullHash === targetHash) {
          matchArray.push({ algo: "CS-Null", api: `${funcName}\\0 (with null)`, type: "Exact" })
        }
        
        // 变体3: 模块名包含null终止符
        if (moduleName) {
          let moduleHash = 0
          let moduleWithNull = moduleName + '\0'
          for (let i = 0; i < moduleWithNull.length; i++) {
            let c = moduleWithNull.charCodeAt(i)
            if (c >= 0x61) c -= 0x20 // 转大写
            moduleHash++;  // ecx++
            moduleHash = ror32(moduleHash, 13)
            moduleHash++;  // ecx++
            moduleHash = (moduleHash + c) >>> 0
          }
          moduleHash++;  // 第46行：模块名哈希完成后的额外递增
          
          let funcHash = 0
          for (let i = 0; i < funcName.length; i++) {
            let c = funcName.charCodeAt(i)
            funcHash++;  // ecx++
            funcHash = ror32(funcHash, 13)
            funcHash++;  // ecx++
            funcHash = (funcHash + c) >>> 0
          }
          
          let combinedHash = (funcHash + moduleHash) >>> 0
          if (combinedHash === targetHash) {
            matchArray.push({ algo: "CS-ModNull", api: `${moduleName}\\0!${funcName} (module with null)`, type: "Exact" })
          }
        }
        
        // 变体4: 两者都包含null终止符
        if (moduleName) {
          let moduleHash = 0
          let moduleWithNull = moduleName + '\0'
          for (let i = 0; i < moduleWithNull.length; i++) {
            let c = moduleWithNull.charCodeAt(i)
            if (c >= 0x61) c -= 0x20 // 转大写
            moduleHash++;  // ecx++
            moduleHash = ror32(moduleHash, 13)
            moduleHash++;  // ecx++
            moduleHash = (moduleHash + c) >>> 0
          }
          moduleHash++;  // 第46行：模块名哈希完成后的额外递增
          
          let funcHash = 0
          let funcWithNull = funcName + '\0'
          for (let i = 0; i < funcWithNull.length; i++) {
            let c = funcWithNull.charCodeAt(i)
            funcHash++;  // ecx++
            funcHash = ror32(funcHash, 13)
            funcHash++;  // ecx++
            funcHash = (funcHash + c) >>> 0
          }
          
          let bothNullHash = (funcHash + moduleHash) >>> 0
          if (bothNullHash === targetHash) {
            matchArray.push({ algo: "CS-BothNull", api: `${moduleName}\\0!${funcName}\\0 (both with null)`, type: "Exact" })
          }
        }
        
        // 变体5: 测试不同的初始值（可能不是0）
        let funcHashSeed1 = 0x12345678 // 测试不同的种子值
        for (let i = 0; i < funcName.length; i++) {
          let c = funcName.charCodeAt(i)
          funcHashSeed1++;  // ecx++
          funcHashSeed1 = ror32(funcHashSeed1, 13)
          funcHashSeed1++;  // ecx++
          funcHashSeed1 = (funcHashSeed1 + c) >>> 0
        }
        if (funcHashSeed1 === targetHash) {
          matchArray.push({ algo: "CS-Seed", api: `${funcName} (seed 0x12345678)`, type: "Exact" })
        }
        
        // 变体6: 测试不同的ROR位数（虽然reverse.c显示是13，但可能有变体）
        let funcRor12Hash = 0
        for (let i = 0; i < funcName.length; i++) {
          let c = funcName.charCodeAt(i)
          funcRor12Hash++;  // ecx++
          funcRor12Hash = ror32(funcRor12Hash, 12) // 测试12位旋转
          funcRor12Hash++;  // ecx++
          funcRor12Hash = (funcRor12Hash + c) >>> 0
        }
        if (funcRor12Hash === targetHash) {
          matchArray.push({ algo: "CS-ROR12", api: `${funcName} (ror12)`, type: "Exact" })
        }
        
        let funcRor14Hash = 0
        for (let i = 0; i < funcName.length; i++) {
          let c = funcName.charCodeAt(i)
          funcRor14Hash++;  // ecx++
          funcRor14Hash = ror32(funcRor14Hash, 14) // 测试14位旋转
          funcRor14Hash++;  // ecx++
          funcRor14Hash = (funcRor14Hash + c) >>> 0
        }
        if (funcRor14Hash === targetHash) {
          matchArray.push({ algo: "CS-ROR14", api: `${funcName} (ror14)`, type: "Exact" })
        }
      }
      
      // 其他算法测试
      function testOtherAlgorithms(displayName, targetHash, matchArray) {
        // CRC32
        let crcHash = hashCRC32(displayName + "\0")
        if (crcHash === targetHash) {
          matchArray.push({ algo: "CRC32", api: displayName, type: "Exact" })
        } else if (Math.abs(crcHash - targetHash) <= 2) {
          matchArray.push({ algo: "CRC32", api: displayName, type: "Approx", diff: crcHash - targetHash })
        }
        
        // DJB2
        let djbHash = hashDJB2(displayName)
        if (djbHash === targetHash) {
          matchArray.push({ algo: "DJB2", api: displayName, type: "Exact" })
        } else if (Math.abs(djbHash - targetHash) <= 2) {
          matchArray.push({ algo: "DJB2", api: displayName, type: "Approx", diff: djbHash - targetHash })
        }
        
        // Jenkins
        let jenHash = hashJenkins(displayName)
        if (jenHash === targetHash) {
          matchArray.push({ algo: "Jenkins", api: displayName, type: "Exact" })
        } else if (Math.abs(jenHash - targetHash) <= 2) {
          matchArray.push({ algo: "Jenkins", api: displayName, type: "Approx", diff: jenHash - targetHash })
        }
      }
      
      // 输出
      let output = `输入: 0x${hexValue.toUpperCase()}  (十进制: ${dec}, 二进制: ${bin})\n`
      output += `字节序列 (大端): [${bytes.join(', ')}], ASCII: "${asciiBE}", UTF-8: "${utf8BE}"\n`
      output += `字节序列 (小端): [${bytesLE.join(', ')}], ASCII: "${asciiLE}", UTF-8: "${utf8LE}"\n`
      
      if (matches.length > 0) {
        output += `匹配结果:\n`
        for (let m of matches) {
          let diffStr = m.type === "Approx" ? ` (差值 ${m.diff})` : ""
          output += `  - ${m.algo}${diffStr}: ${m.api}\n`
        }
      } else {
        output += "未匹配到已知 API 哈希或字符串。\n"
      }
      
      return output
    }

    // 分析多个十六进制值
    const analyzeHexValues = (input, apiList) => {
      const lines = input.split(/\r?\n/).filter(line => line.trim())
      return lines.map(line => analyzeHexValue(line, apiList)).join("\n")
    }

    // 文件上传处理
    const handleFileUpload = (file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target.result
        const apiList = content.split(/\r?\n/).filter(line => line.trim())
        customApiList.value = apiList
        message.success(`成功加载 ${apiList.length} 个自定义API`)
      }
      reader.readAsText(file)
      return false // 阻止自动上传
    }

    // 清除自定义API
    const clearCustomApi = () => {
      customApiList.value = []
      message.success('已清除自定义API列表')
    }

    // 解析结果文本为结构化数据
    const parseResults = (resultText) => {
      const sections = resultText.split('\n\n').filter(section => section.trim())
      const parsed = []
      
      for (const section of sections) {
        const lines = section.split('\n')
        if (lines.length === 0) continue
        
        const result = {
          title: '',
          hex: '',
          decimal: '',
          binary: '',
          bytesBE: [],
          asciiBE: '',
          utf8BE: '',
          bytesLE: [],
          asciiLE: '',
          utf8LE: '',
          matches: []
        }
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          
          if (line.startsWith('输入:')) {
            // 解析基本信息行
            const hexMatch = line.match(/0x([0-9A-F]+)/)
            const decMatch = line.match(/十进制: (\d+)/)
            const binMatch = line.match(/二进制: ([01]+)/)
            
            if (hexMatch) {
              result.hex = '0x' + hexMatch[1]
              result.title = `分析结果: ${result.hex}`
            }
            if (decMatch) result.decimal = decMatch[1]
            if (binMatch) result.binary = binMatch[1]
          } else if (line.includes('字节序列 (大端):')) {
            // 解析大端字节序列
            const bytesMatch = line.match(/\[([0-9, ]+)\]/)
            const asciiMatch = line.match(/ASCII: "([^"]*)"/)
            const utf8Match = line.match(/UTF-8: "([^"]*)"/)
            
            if (bytesMatch) {
              result.bytesBE = bytesMatch[1].split(', ').map(b => parseInt(b.trim()))
            }
            if (asciiMatch) result.asciiBE = asciiMatch[1]
            if (utf8Match) result.utf8BE = utf8Match[1]
          } else if (line.includes('字节序列 (小端):')) {
            // 解析小端字节序列
            const bytesMatch = line.match(/\[([0-9, ]+)\]/)
            const asciiMatch = line.match(/ASCII: "([^"]*)"/)
            const utf8Match = line.match(/UTF-8: "([^"]*)"/)
            
            if (bytesMatch) {
              result.bytesLE = bytesMatch[1].split(', ').map(b => parseInt(b.trim()))
            }
            if (asciiMatch) result.asciiLE = asciiMatch[1]
            if (utf8Match) result.utf8LE = utf8Match[1]
          } else if (line.startsWith('  - ')) {
            // 解析匹配结果
            const match = {}
            const matchText = line.substring(4) // 移除 "  - "
            
            if (matchText.includes('(差值')) {
              // 近似匹配
              const parts = matchText.split(':')
              if (parts.length >= 2) {
                const algoPart = parts[0].trim()
                const diffMatch = algoPart.match(/(\w+) \(差值 ([+-]?\d+)\)/)
                if (diffMatch) {
                  match.algo = diffMatch[1]
                  match.diff = parseInt(diffMatch[2])
                  match.type = 'Approx'
                }
                match.api = parts.slice(1).join(':').trim()
              }
            } else {
              // 精确匹配
              const parts = matchText.split(':')
              if (parts.length >= 2) {
                match.algo = parts[0].trim()
                match.type = 'Exact'
                match.api = parts.slice(1).join(':').trim()
              }
            }
            
            if (match.algo && match.api) {
              result.matches.push(match)
            }
          }
        }
        
        if (result.hex) {
          parsed.push(result)
        }
      }
      
      return parsed
    }

    // 获取算法颜色
    const getAlgorithmColor = (algorithm) => {
      const colors = {
        'ROR13': 'red',
        'CRC32': 'blue',
        'DJB2': 'green',
        'Jenkins': 'orange'
      }
      return colors[algorithm] || 'default'
    }

    // 分析哈希
    const analyzeHashes = async () => {
      if (!hexInput.value.trim()) {
        message.warning('请输入十六进制值')
        return
      }
      
      analyzing.value = true
      try {
        await new Promise(resolve => setTimeout(resolve, 100)) // 模拟异步
        
        // 测试特定哈希值
        const targetHashes = [
          0xa779563a,
          0xc69f8957,
          0x3b2e55eb,
          0x7b18062d,
          0x56a2b5f0,
          0xe553a458,
          0xe2899612
        ]
        
        const inputLines = hexInput.value.split('\n').map(line => line.trim()).filter(line => line)
        for (let line of inputLines) {
          let hexValue = line
          if (hexValue.startsWith('0x') || hexValue.startsWith('0X')) {
            hexValue = hexValue.slice(2)
          }
          
          if (/^[0-9a-fA-F]+$/.test(hexValue)) {
            let hash = parseInt(hexValue, 16) >>> 0
            if (targetHashes.includes(hash)) {
              comprehensiveDebug(hash)
            }
          }
        }
        
        const resultText = analyzeHexValues(hexInput.value, customApiList.value)
        results.value = resultText
        rawResults.value = resultText
        parsedResults.value = parseResults(resultText)
        message.success('分析完成')
      } catch (error) {
        message.error('分析失败：' + error.message)
      } finally {
        analyzing.value = false
      }
    }

    // 清除结果
    const clearResults = () => {
      results.value = ''
      rawResults.value = ''
      parsedResults.value = []
      message.success('已清除结果')
    }

    // 复制结果
    const copyResults = async () => {
      if (!rawResults.value) {
        message.warning('没有可复制的结果')
        return
      }
      
      try {
        await navigator.clipboard.writeText(rawResults.value)
        message.success('结果已复制到剪贴板')
      } catch (error) {
        message.error('复制失败')
      }
    }

    // 显示帮助弹窗
    const showHelpModal = () => {
      helpModalVisible.value = true
    }

    // 调试函数：详细分析哈希计算
    const debugHashCalculation = (targetHash) => {
      console.log(`\n=== 调试哈希值 0x${targetHash.toString(16)} ===`)
      
      // 测试一些最可能的API组合
      const testApis = [
        'kernel32.dll!LoadLibraryA',
        'kernel32.dll!GetProcAddress',
        'kernel32.dll!VirtualAlloc',
        'kernel32.dll!CreateProcessA',
        'kernel32.dll!OpenProcess',
        'kernel32.dll!WriteProcessMemory',
        'kernel32.dll!ReadProcessMemory',
        'kernel32.dll!CreateRemoteThread',
        'kernel32.dll!Sleep',
        'kernel32.dll!GetTickCount',
        'kernel32.dll!GetCurrentProcess',
        'kernel32.dll!TerminateProcess',
        'kernel32.dll!ExitProcess',
        'kernel32.dll!GetModuleHandleA',
        'kernel32.dll!FreeLibrary',
        'kernel32.dll!CreateFileA',
        'kernel32.dll!ReadFile',
        'kernel32.dll!WriteFile',
        'kernel32.dll!CloseHandle',
        'kernel32.dll!GetSystemInfo',
        'kernel32.dll!GetVersion',
        'kernel32.dll!GetComputerNameA',
        'kernel32.dll!GetUserNameA',
        'kernel32.dll!GetEnvironmentVariableA',
        'kernel32.dll!GetTempPathA',
        'kernel32.dll!GetLastError',
        'kernel32.dll!SetLastError',
        'kernel32.dll!GetCommandLineA',
        'kernel32.dll!WinExec',
        'kernel32.dll!CreateToolhelp32Snapshot',
        'kernel32.dll!Process32First',
        'kernel32.dll!Process32Next',
        'kernel32.dll!Thread32First',
        'kernel32.dll!Thread32Next',
        'kernel32.dll!Module32First',
        'kernel32.dll!Module32Next',
        'user32.dll!MessageBoxA',
        'user32.dll!FindWindowA',
        'user32.dll!FindWindowExA',
        'user32.dll!GetDesktopWindow',
        'user32.dll!GetForegroundWindow',
        'user32.dll!ShowWindow',
        'user32.dll!GetWindowTextA',
        'user32.dll!SetWindowTextA',
        'user32.dll!SendMessageA',
        'user32.dll!PostMessageA',
        'user32.dll!GetMessageA',
        'user32.dll!DispatchMessageA',
        'user32.dll!RegisterClassA',
        'user32.dll!CreateWindowExA',
        'user32.dll!DestroyWindow',
        'user32.dll!DefWindowProcA',
        'user32.dll!GetWindowRect',
        'user32.dll!SetWindowPos',
        'user32.dll!GetClientRect',
        'user32.dll!GetDC',
        'user32.dll!ReleaseDC',
        'user32.dll!RegisterHotKey',
        'user32.dll!SetWindowsHookExA',
        'user32.dll!GetKeyState',
        'user32.dll!GetAsyncKeyState',
        'user32.dll!keybd_event',
        'user32.dll!mouse_event',
        'advapi32.dll!RegOpenKeyA',
        'advapi32.dll!RegCreateKeyA',
        'advapi32.dll!RegCloseKey',
        'advapi32.dll!RegSetValueA',
        'advapi32.dll!RegSetValueExA',
        'advapi32.dll!RegQueryValueA',
        'advapi32.dll!RegQueryValueExA',
        'advapi32.dll!RegDeleteKeyA',
        'advapi32.dll!RegDeleteValueA',
        'advapi32.dll!RegEnumKeyA',
        'advapi32.dll!RegEnumValueA',
        'advapi32.dll!OpenServiceA',
        'advapi32.dll!CreateServiceA',
        'advapi32.dll!DeleteService',
        'advapi32.dll!StartServiceA',
        'advapi32.dll!ControlService',
        'advapi32.dll!OpenSCManagerA',
        'advapi32.dll!CloseServiceHandle',
        'advapi32.dll!QueryServiceStatus',
        'advapi32.dll!OpenProcessToken',
        'advapi32.dll!GetTokenInformation',
        'advapi32.dll!LookupPrivilegeValueA',
        'advapi32.dll!AdjustTokenPrivileges',
        'advapi32.dll!DuplicateToken',
        'advapi32.dll!LogonUserA',
        'advapi32.dll!CreateProcessAsUserA',
        'advapi32.dll!CryptAcquireContextA',
        'advapi32.dll!CryptReleaseContext',
        'advapi32.dll!CryptCreateHash',
        'advapi32.dll!CryptHashData',
        'advapi32.dll!CryptGetHashParam',
        'advapi32.dll!CryptDestroyHash',
        'advapi32.dll!CryptGenKey',
        'advapi32.dll!CryptImportKey',
        'advapi32.dll!CryptExportKey',
        'advapi32.dll!CryptEncrypt',
        'advapi32.dll!CryptDecrypt',
        'advapi32.dll!CryptDestroyKey',
        'ntdll.dll!NtQueryInformationProcess',
        'ntdll.dll!NtSetInformationProcess',
        'ntdll.dll!NtQuerySystemInformation',
        'ntdll.dll!NtReadVirtualMemory',
        'ntdll.dll!NtWriteVirtualMemory',
        'ntdll.dll!NtAllocateVirtualMemory',
        'ntdll.dll!NtFreeVirtualMemory',
        'ntdll.dll!NtProtectVirtualMemory',
        'ntdll.dll!NtOpenProcess',
        'ntdll.dll!NtOpenThread',
        'ntdll.dll!NtCreateProcess',
        'ntdll.dll!NtCreateProcessEx',
        'ntdll.dll!NtCreateThread',
        'ntdll.dll!NtCreateThreadEx',
        'ntdll.dll!NtTerminateProcess',
        'ntdll.dll!NtTerminateThread',
        'ntdll.dll!NtSuspendProcess',
        'ntdll.dll!NtResumeProcess',
        'ntdll.dll!NtSuspendThread',
        'ntdll.dll!NtResumeThread',
        'ntdll.dll!NtClose',
        'ntdll.dll!NtCreateFile',
        'ntdll.dll!NtReadFile',
        'ntdll.dll!NtWriteFile',
        'ntdll.dll!NtDeviceIoControlFile',
        'ntdll.dll!NtQueryInformationFile',
        'ntdll.dll!NtSetInformationFile',
        'ntdll.dll!NtCreateSection',
        'ntdll.dll!NtMapViewOfSection',
        'ntdll.dll!NtUnmapViewOfSection',
        'ntdll.dll!NtOpenSection',
        'ntdll.dll!NtQuerySection',
        'ntdll.dll!NtDelayExecution',
        'ntdll.dll!NtYieldExecution',
        'ntdll.dll!NtGetContextThread',
        'ntdll.dll!NtSetContextThread',
        'ntdll.dll!NtQueueApcThread',
        'ntdll.dll!NtTestAlert',
        'ntdll.dll!RtlCreateUserThread',
        'ntdll.dll!RtlExitUserThread',
        'ntdll.dll!LdrLoadDll',
        'ntdll.dll!LdrUnloadDll',
        'ntdll.dll!LdrGetProcedureAddress',
        'ntdll.dll!LdrGetDllHandle',
        'ntdll.dll!RtlInitUnicodeString',
        'ntdll.dll!RtlCreateUnicodeString',
        'ntdll.dll!RtlFreeUnicodeString',
        'ntdll.dll!RtlAnsiStringToUnicodeString',
        'ntdll.dll!RtlUnicodeStringToAnsiString'
      ]
      
      let foundMatch = false
      
      // 先测试一些最可能的API
      const priorityApis = [
        'kernel32.dll!LoadLibraryA',
        'kernel32.dll!GetProcAddress',
        'kernel32.dll!VirtualAlloc',
        'kernel32.dll!CreateProcessA',
        'kernel32.dll!OpenProcess',
        'kernel32.dll!WriteProcessMemory',
        'kernel32.dll!ReadProcessMemory',
        'kernel32.dll!CreateRemoteThread',
        'ntdll.dll!NtAllocateVirtualMemory',
        'ntdll.dll!NtCreateProcess',
        'ntdll.dll!NtOpenProcess',
        'ntdll.dll!NtWriteVirtualMemory',
        'ntdll.dll!NtCreateThread',
        'ntdll.dll!NtCreateThreadEx'
      ]
      
      console.log('优先测试最可能的API...')
      for (let api of priorityApis) {
        let [mod, func] = api.split('!')
        if (debugHashStepByStep(mod, func, targetHash)) {
          foundMatch = true
          break
        }
      }
      
      if (!foundMatch) {
        console.log('\n优先API未找到匹配，测试所有API...')
        for (let api of testApis) {
          let [mod, func] = api.split('!')
          
          // 测试完整API名称
          let hash = calculateCSHash(mod, func)
          if (hash === targetHash) {
            console.log(`*** 找到匹配: ${api} ***`)
            foundMatch = true
            break
          }
          
          // 测试只有函数名
          let funcOnlyHash = calculateCSHash('', func)
          if (funcOnlyHash === targetHash) {
            console.log(`*** 找到匹配: ${func} (函数名) ***`)
            foundMatch = true
            break
          }
          
          // 测试不带.dll后缀的模块名
          if (mod.endsWith('.dll')) {
            let modNoExt = mod.replace('.dll', '')
            let hashNoExt = calculateCSHash(modNoExt, func)
            if (hashNoExt === targetHash) {
              console.log(`*** 找到匹配: ${modNoExt}!${func} ***`)
              foundMatch = true
              break
            }
          }
          
          // 测试大写模块名
          let hashUpper = calculateCSHash(mod.toUpperCase(), func)
          if (hashUpper === targetHash) {
            console.log(`*** 找到匹配: ${mod.toUpperCase()}!${func} ***`)
            foundMatch = true
            break
          }
          
          // 测试小写模块名
          let hashLower = calculateCSHash(mod.toLowerCase(), func)
          if (hashLower === targetHash) {
            console.log(`*** 找到匹配: ${mod.toLowerCase()}!${func} ***`)
            foundMatch = true
            break
          }
        }
      }
      
      if (!foundMatch) {
        console.log('未找到匹配的API')
        
        // 输出一些示例哈希值用于调试
        console.log('\n示例哈希值:')
        let examples = [
          'kernel32.dll!LoadLibraryA',
          'kernel32.dll!GetProcAddress',
          'kernel32.dll!VirtualAlloc',
          'ntdll.dll!NtAllocateVirtualMemory',
          'ntdll.dll!NtCreateProcess',
          'ntdll.dll!NtOpenProcess'
        ]
        
        for (let example of examples) {
          let [mod, func] = example.split('!')
          let hash = calculateCSHash(mod, func)
          console.log(`${example}: 0x${hash.toString(16)}`)
        }
      }
    }

    // 详细调试哈希计算过程
    const debugHashStepByStep = (moduleName, funcName, targetHash) => {
      console.log(`\n=== 详细调试: ${moduleName || 'NULL'}!${funcName} ===`)
      console.log(`目标哈希: 0x${targetHash.toString(16)}`)
      
      // 测试不同的循环终止条件
      const testVariants = [
        { name: '标准null终止', module: moduleName, func: funcName },
        { name: '模块null终止', module: moduleName + '\0', func: funcName },
        { name: '函数null终止', module: moduleName, func: funcName + '\0' },
        { name: '两者null终止', module: moduleName + '\0', func: funcName + '\0' },
        { name: '只有函数名', module: '', func: funcName },
        { name: '只有函数名+null', module: '', func: funcName + '\0' }
      ]
      
      for (let variant of testVariants) {
        console.log(`\n--- 测试变体: ${variant.name} ---`)
        
        let var_18h = 0
        
        // 计算模块名哈希
        if (variant.module && variant.module.length > 0) {
          console.log(`模块名: "${variant.module}"`)
          var_18h = 0
          for (let i = 0; i < variant.module.length; i++) {
            let c = variant.module.charCodeAt(i)
            if (c === 0) {
              console.log(`  遇到null，停止模块名处理`)
              break
            }
            
            let originalC = c
            if (c >= 0x61) {
              c -= 0x20
              console.log(`  字符 '${String.fromCharCode(originalC)}' -> '${String.fromCharCode(c)}' (转大写)`)
            } else {
              console.log(`  字符 '${String.fromCharCode(c)}'`)
            }
            
            var_18h = (var_18h + 1) >>> 0
            console.log(`  ecx++: ${var_18h}`)
            
            var_18h = ror32(var_18h, 13)
            console.log(`  ror32(13): 0x${var_18h.toString(16)}`)
            
            var_18h = (var_18h + 1) >>> 0
            console.log(`  ecx++: ${var_18h}`)
            
            var_18h = (var_18h + c) >>> 0
            console.log(`  ecx += ${c}: 0x${var_18h.toString(16)}`)
          }
          var_18h = (var_18h + 1) >>> 0
          console.log(`模块名哈希完成，额外递增: 0x${var_18h.toString(16)}`)
        } else {
          console.log(`无模块名`)
        }
        
        // 计算函数名哈希
        console.log(`函数名: "${variant.func}"`)
        let ecx = 0
        for (let i = 0; i < variant.func.length; i++) {
          let c = variant.func.charCodeAt(i)
          if (c === 0) {
            console.log(`  遇到null，停止函数名处理`)
            break
          }
          
          console.log(`  字符 '${String.fromCharCode(c)}'`)
          
          ecx = (ecx + 1) >>> 0
          console.log(`  ecx++: ${ecx}`)
          
          ecx = ror32(ecx, 13)
          console.log(`  ror32(13): 0x${ecx.toString(16)}`)
          
          ecx = (ecx + 1) >>> 0
          console.log(`  ecx++: ${ecx}`)
          
          ecx = (ecx + c) >>> 0
          console.log(`  ecx += ${c}: 0x${ecx.toString(16)}`)
        }
        
        // 组合哈希
        let finalHash = (ecx + var_18h) >>> 0
        console.log(`最终哈希: 0x${ecx.toString(16)} + 0x${var_18h.toString(16)} = 0x${finalHash.toString(16)}`)
        
        if (finalHash === targetHash) {
          console.log(`*** 找到匹配! ***`)
          return true
        }
      }
      
      return false
    }

    // 全面调试哈希计算
    const comprehensiveDebug = (targetHash) => {
      console.log(`\n=== 全面调试哈希值 0x${targetHash.toString(16)} ===`)
      
      // 测试更多可能的API组合
      const extendedApis = [
        // 最基础的API
        'LoadLibraryA',
        'GetProcAddress',
        'VirtualAlloc',
        'CreateProcessA',
        'OpenProcess',
        'WriteProcessMemory',
        'ReadProcessMemory',
        'CreateRemoteThread',
        'Sleep',
        'GetTickCount',
        'GetCurrentProcess',
        'TerminateProcess',
        'ExitProcess',
        'GetModuleHandleA',
        'FreeLibrary',
        'CreateFileA',
        'ReadFile',
        'WriteFile',
        'CloseHandle',
        'GetSystemInfo',
        'GetVersion',
        'GetComputerNameA',
        'GetUserNameA',
        'GetEnvironmentVariableA',
        'GetTempPathA',
        'GetLastError',
        'SetLastError',
        'GetCommandLineA',
        'WinExec',
        'CreateToolhelp32Snapshot',
        'Process32First',
        'Process32Next',
        'Thread32First',
        'Thread32Next',
        'Module32First',
        'Module32Next',
        
        // 用户界面API
        'MessageBoxA',
        'FindWindowA',
        'FindWindowExA',
        'GetDesktopWindow',
        'GetForegroundWindow',
        'ShowWindow',
        'GetWindowTextA',
        'SetWindowTextA',
        'SendMessageA',
        'PostMessageA',
        'GetMessageA',
        'DispatchMessageA',
        'RegisterClassA',
        'CreateWindowExA',
        'DestroyWindow',
        'DefWindowProcA',
        'GetWindowRect',
        'SetWindowPos',
        'GetClientRect',
        'GetDC',
        'ReleaseDC',
        'RegisterHotKey',
        'SetWindowsHookExA',
        'GetKeyState',
        'GetAsyncKeyState',
        'keybd_event',
        'mouse_event',
        
        // 注册表和安全API
        'RegOpenKeyA',
        'RegCreateKeyA',
        'RegCloseKey',
        'RegSetValueA',
        'RegSetValueExA',
        'RegQueryValueA',
        'RegQueryValueExA',
        'RegDeleteKeyA',
        'RegDeleteValueA',
        'RegEnumKeyA',
        'RegEnumValueA',
        'OpenServiceA',
        'CreateServiceA',
        'DeleteService',
        'StartServiceA',
        'ControlService',
        'OpenSCManagerA',
        'CloseServiceHandle',
        'QueryServiceStatus',
        'OpenProcessToken',
        'GetTokenInformation',
        'LookupPrivilegeValueA',
        'AdjustTokenPrivileges',
        'DuplicateToken',
        'LogonUserA',
        'CreateProcessAsUserA',
        'CryptAcquireContextA',
        'CryptReleaseContext',
        'CryptCreateHash',
        'CryptHashData',
        'CryptGetHashParam',
        'CryptDestroyHash',
        'CryptGenKey',
        'CryptImportKey',
        'CryptExportKey',
        'CryptEncrypt',
        'CryptDecrypt',
        'CryptDestroyKey',
        
        // 原生API
        'NtQueryInformationProcess',
        'NtSetInformationProcess',
        'NtQuerySystemInformation',
        'NtReadVirtualMemory',
        'NtWriteVirtualMemory',
        'NtAllocateVirtualMemory',
        'NtFreeVirtualMemory',
        'NtProtectVirtualMemory',
        'NtOpenProcess',
        'NtOpenThread',
        'NtCreateProcess',
        'NtCreateProcessEx',
        'NtCreateThread',
        'NtCreateThreadEx',
        'NtTerminateProcess',
        'NtTerminateThread',
        'NtSuspendProcess',
        'NtResumeProcess',
        'NtSuspendThread',
        'NtResumeThread',
        'NtClose',
        'NtCreateFile',
        'NtReadFile',
        'NtWriteFile',
        'NtDeviceIoControlFile',
        'NtQueryInformationFile',
        'NtSetInformationFile',
        'NtCreateSection',
        'NtMapViewOfSection',
        'NtUnmapViewOfSection',
        'NtOpenSection',
        'NtQuerySection',
        'NtDelayExecution',
        'NtYieldExecution',
        'NtGetContextThread',
        'NtSetContextThread',
        'NtQueueApcThread',
        'NtTestAlert',
        'RtlCreateUserThread',
        'RtlExitUserThread',
        'LdrLoadDll',
        'LdrUnloadDll',
        'LdrGetProcedureAddress',
        'LdrGetDllHandle',
        'RtlInitUnicodeString',
        'RtlCreateUnicodeString',
        'RtlFreeUnicodeString',
        'RtlAnsiStringToUnicodeString',
        'RtlUnicodeStringToAnsiString',
        
        // 网络API
        'WSAStartup',
        'WSACleanup',
        'WSASocketA',
        'socket',
        'bind',
        'listen',
        'accept',
        'connect',
        'send',
        'recv',
        'sendto',
        'recvfrom',
        'closesocket',
        'shutdown',
        'setsockopt',
        'getsockopt',
        'gethostname',
        'gethostbyname',
        'gethostbyaddr',
        'getservbyname',
        'getservbyport',
        'inet_addr',
        'inet_ntoa',
        'htons',
        'htonl',
        'ntohs',
        'ntohl',
        'select',
        'ioctlsocket',
        'WSAGetLastError',
        'WSASetLastError',
        'WSAEventSelect',
        'WSACreateEvent',
        'WSACloseEvent',
        'WSAWaitForMultipleEvents',
        'WSAEnumNetworkEvents',
        
        // 互联网API
        'InternetOpenA',
        'InternetCloseHandle',
        'InternetConnectA',
        'InternetOpenUrlA',
        'InternetReadFile',
        'InternetWriteFile',
        'InternetQueryDataAvailable',
        'HttpOpenRequestA',
        'HttpSendRequestA',
        'HttpSendRequestExA',
        'HttpQueryInfoA',
        'HttpAddRequestHeadersA',
        'InternetSetOptionA',
        'InternetQueryOptionA',
        'FtpOpenFileA',
        'FtpGetFileA',
        'FtpPutFileA',
        'FtpDeleteFileA',
        'FtpFindFirstFileA',
        'InternetFindNextFileA',
        
        // Shell API
        'ShellExecuteA',
        'ShellExecuteExA',
        'SHGetSpecialFolderPathA',
        'SHGetFolderPathA',
        'SHGetKnownFolderPath',
        'SHGetDesktopFolder',
        'SHBrowseForFolderA',
        'SHFileOperationA',
        'ShellNotifyIconA',
        'ExtractIconA',
        'ExtractIconExA',
        'FindExecutableA',
        'CommandLineToArgvW',
        
        // COM API
        'CoInitialize',
        'CoInitializeEx',
        'CoUninitialize',
        'CoCreateInstance',
        'CoCreateInstanceEx',
        'CoGetClassObject',
        'CoFreeLibrary',
        'CoLoadLibrary',
        'CoTaskMemAlloc',
        'CoTaskMemFree',
        'CreateStreamOnHGlobal',
        'GetHGlobalFromStream',
        
        // 加密API
        'CertOpenStore',
        'CertCloseStore',
        'CertFindCertificateInStore',
        'CertFreeCertificateContext',
        'CertGetCertificateContextProperty',
        'CertSetCertificateContextProperty',
        'CryptDecodeObjectEx',
        'CryptEncodeObjectEx',
        'CryptStringToBinaryA',
        'CryptBinaryToStringA',
        'CryptHashCertificate',
        'CryptVerifyCertificateSignatureEx',
        
        // 进程状态API
        'EnumProcesses',
        'EnumProcessModules',
        'EnumProcessModulesEx',
        'GetModuleBaseNameA',
        'GetModuleFileNameExA',
        'GetModuleInformation',
        'GetProcessMemoryInfo',
        'GetPerformanceInfo',
        'EnumDeviceDrivers',
        'GetDeviceDriverBaseNameA',
        'GetDeviceDriverFileNameA',
        
        // URL Moniker API
        'URLDownloadToFileA',
        'URLDownloadToCacheFileA',
        'URLOpenStreamA',
        'URLOpenBlockingStreamA',
        'CoInternetCreateUrl',
        'CoInternetParseUrl',
        
        // Shell轻量级API
        'PathFileExistsA',
        'PathFindFileNameA',
        'PathFindExtensionA',
        'PathRemoveFileSpecA',
        'PathCombineA',
        'PathAppendA',
        'PathIsDirectoryA',
        'PathIsFileSpecA',
        'StrStrA',
        'StrStrIA',
        'StrCmpA',
        'StrCmpIA',
        
        // 调试帮助API
        'SymInitialize',
        'SymCleanup',
        'SymLoadModule64',
        'SymUnloadModule64',
        'SymGetSymFromAddr64',
        'SymGetLineFromAddr64',
        'StackWalk64',
        'MiniDumpWriteDump',
        'ImageNtHeader',
        'ImageDirectoryEntryToData',
        'ImageRvaToVa',
        
        // 版本信息API
        'GetFileVersionInfoA',
        'GetFileVersionInfoSizeA',
        'VerQueryValueA',
        'VerLanguageNameA',
        
        // 映像帮助API
        'ImageLoad',
        'ImageUnload',
        'ImageGetDigestStream',
        'ImageGetCertificateData',
        'ImageGetCertificateHeader',
        'MapFileAndCheckSumA',
        
        // 终端服务API
        'WTSEnumerateSessionsA',
        'WTSQuerySessionInformationA',
        'WTSFreeMemory',
        'WTSTerminateProcess',
        'WTSLogoffSession',
        'WTSDisconnectSession',
        
        // IP帮助API
        'GetAdaptersInfo',
        'GetAdaptersAddresses',
        'GetNetworkParams',
        'GetIpAddrTable',
        'GetTcpTable',
        'GetUdpTable',
        'GetExtendedTcpTable',
        'GetExtendedUdpTable',
        
        // 安装API
        'SetupDiGetClassDevsA',
        'SetupDiEnumDeviceInterfaces',
        'SetupDiGetDeviceInterfaceDetailA',
        'SetupDiDestroyDeviceInfoList',
        
        // WMI相关
        'SysAllocString',
        'SysFreeString',
        'VariantInit',
        'VariantClear',
        
        // 反调试相关
        'IsDebuggerPresent',
        'CheckRemoteDebuggerPresent',
        'OutputDebugStringA',
        'OutputDebugStringW',
        'SetUnhandledExceptionFilter',
        'UnhandledExceptionFilter',
        'DbgBreakPoint',
        'DbgUserBreakPoint',
        
        // 持久化相关
        'SetFileAttributesA',
        'SetFileAttributesW',
        
        // 网络钓鱼和窃取相关
        'GetWindowTextA',
        'GetWindowTextW',
        'GetClassNameA',
        'GetClassNameW',
        'EnumWindows',
        'SetWindowsHookExA',
        'SetWindowsHookExW',
        
        // 提权相关
        'LookupPrivilegeValueA',
        'LookupPrivilegeValueW',
        'AdjustTokenPrivileges',
        'OpenProcessToken',
        
        // Rootkit常用
        'ZwSetSystemInformation',
        'NtLoadDriver',
        'NtUnloadDriver',
        'NtSystemDebugControl',
        
        // 代码注入常用
        'VirtualAllocEx',
        'WriteProcessMemory',
        'CreateRemoteThread',
        'NtCreateThreadEx',
        'RtlCreateUserThread',
        'NtQueueApcThread',
        'NtMapViewOfSection',
        'NtCreateSection',
        
        // 进程空心化(Process Hollowing)
        'NtUnmapViewOfSection',
        'SetThreadContext',
        'GetThreadContext',
        'ResumeThread',
        
        // DLL劫持相关
        'LoadLibraryA',
        'LoadLibraryW',
        'GetProcAddress',
        'GetModuleHandleA',
        'GetModuleHandleW'
      ]
      
      let foundMatch = false
      
      // 测试只有函数名的情况（最可能的情况）
      console.log('测试只有函数名的情况...')
      for (let func of extendedApis) {
        let hash = calculateCSHash('', func)
        if (hash === targetHash) {
          console.log(`*** 找到匹配: ${func} (只有函数名) ***`)
          foundMatch = true
          break
        }
      }
      
      if (!foundMatch) {
        // 测试带模块名的情况
        console.log('测试带模块名的情况...')
        const modules = [
          'kernel32.dll',
          'user32.dll',
          'advapi32.dll',
          'ntdll.dll',
          'ws2_32.dll',
          'wininet.dll',
          'shell32.dll',
          'ole32.dll',
          'crypt32.dll',
          'psapi.dll',
          'urlmon.dll',
          'shlwapi.dll',
          'dbghelp.dll',
          'version.dll',
          'imagehlp.dll',
          'wtsapi32.dll',
          'iphlpapi.dll',
          'setupapi.dll',
          'oleaut32.dll'
        ]
        
        for (let mod of modules) {
          for (let func of extendedApis) {
            let hash = calculateCSHash(mod, func)
            if (hash === targetHash) {
              console.log(`*** 找到匹配: ${mod}!${func} ***`)
              foundMatch = true
              break
            }
          }
          if (foundMatch) break
        }
      }
      
      if (!foundMatch) {
        // 测试不带.dll后缀的模块名
        console.log('测试不带.dll后缀的模块名...')
        const modulesNoExt = [
          'kernel32',
          'user32',
          'advapi32',
          'ntdll',
          'ws2_32',
          'wininet',
          'shell32',
          'ole32',
          'crypt32',
          'psapi',
          'urlmon',
          'shlwapi',
          'dbghelp',
          'version',
          'imagehlp',
          'wtsapi32',
          'iphlpapi',
          'setupapi',
          'oleaut32'
        ]
        
        for (let mod of modulesNoExt) {
          for (let func of extendedApis) {
            let hash = calculateCSHash(mod, func)
            if (hash === targetHash) {
              console.log(`*** 找到匹配: ${mod}!${func} ***`)
              foundMatch = true
              break
            }
          }
          if (foundMatch) break
        }
      }
      
      if (!foundMatch) {
        console.log('未找到匹配的API')
        
        // 输出一些示例哈希值用于调试
        console.log('\n示例哈希值:')
        let examples = [
          'LoadLibraryA',
          'GetProcAddress',
          'VirtualAlloc',
          'CreateProcessA',
          'OpenProcess',
          'WriteProcessMemory',
          'ReadProcessMemory',
          'CreateRemoteThread',
          'Sleep',
          'GetTickCount',
          'MessageBoxA',
          'FindWindowA',
          'RegOpenKeyA',
          'RegSetValueA',
          'NtAllocateVirtualMemory',
          'NtCreateProcess',
          'NtOpenProcess',
          'NtWriteVirtualMemory',
          'NtCreateThread',
          'NtCreateThreadEx'
        ]
        
        for (let example of examples) {
          let hash = calculateCSHash('', example)
          console.log(`${example}: 0x${hash.toString(16)}`)
        }
      }
    }

    return {
      hexInput,
      results,
      analyzing,
      customApiList,
      parsedResults,
      rawResults,
      handleFileUpload,
      clearCustomApi,
      analyzeHashes,
      clearResults,
      copyResults,
      getAlgorithmColor,
      helpModalVisible,
      showHelpModal,
      debugHashCalculation,
      debugHashStepByStep,
      comprehensiveDebug
    }
  }
}
</script>

<style scoped>
.hash-analyzer {
  padding: 0;
}

.results-card {
  margin-top: 16px;
}

.result-item {
  margin-bottom: 16px;
}

.result-item:last-child {
  margin-bottom: 0;
}

.single-result {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.binary-code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  word-break: break-all;
}

.match-results {
  line-height: 1.8;
}

.match-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 8px;
}

.match-type {
  display: inline-flex;
  align-items: center;
}

.api-code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  background-color: #f0f2f5;
  padding: 2px 6px;
  border-radius: 3px;
  color: #1890ff;
}

.separator {
  color: #d9d9d9;
  font-weight: bold;
  margin: 0 4px;
}

.no-match {
  color: #8c8c8c;
  font-style: italic;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-2 {
  margin-top: 8px;
}

.ml-2 {
  margin-left: 8px;
}

/* 帮助弹窗样式 */
.help-content h4 {
  color: #1890ff;
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

.help-content h4:first-child {
  margin-top: 0;
}

.algorithm-list,
.usage-steps,
.match-types {
  margin-bottom: 16px;
}

.algorithm-list li,
.match-types li {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.usage-steps li {
  margin-bottom: 6px;
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .matches-grid {
    grid-template-columns: 1fr;
  }
  
  .match-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

/* 美化描述列表 */
:deep(.ant-descriptions-item-label) {
  font-weight: 600;
  color: #595959;
  width: 120px;
}

:deep(.ant-descriptions-item-content) {
  color: #262626;
}

/* 优化折叠面板样式 */
:deep(.ant-collapse-header) {
  font-weight: 500;
  color: #595959;
}

:deep(.ant-collapse-content-box) {
  padding: 16px !important;
}
</style> 