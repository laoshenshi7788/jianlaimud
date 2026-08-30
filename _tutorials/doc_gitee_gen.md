# Mud 代码生成器

## 功能概览

Mud 代码生成器是一套基于 Roslyn 的源代码生成器，用于根据实体类和服务接口自动生成相关代码，提高开发效率。

### 主要组件

| 组件 | 功能描述 | NuGet |
|------|----------|-------|
| Mud.EntityCodeGenerator | 实体代码生成：DTO、VO、QueryInput、CrInput、UpInput、Builder模式 | [![Nuget](https://img.shields.io/nuget/v/Mud.EntityCodeGenerator.svg)](https://www.nuget.org/packages/Mud.EntityCodeGenerator/) |
| Mud.ServiceCodeGenerator | 服务代码生成：HttpClient API、依赖注入、COM包装、自动注册 | [![Nuget](https://img.shields.io/nuget/v/Mud.ServiceCodeGenerator.svg)](https://www.nuget.org/packages/Mud.ServiceCodeGenerator/) |

## 快速开始

### 1. 安装包

```xml
<ItemGroup>
  <PackageReference Include="Mud.EntityCodeGenerator" Version="1.1.6" />
  <PackageReference Include="Mud.ServiceCodeGenerator" Version="1.1.6" />
</ItemGroup>
```

### 2. 基本配置

```xml
<PropertyGroup>
  <EmitCompilerGeneratedFiles>true</EmitCompilerGeneratedFiles>
  <EntitySuffix>Entity</EntitySuffix>
</PropertyGroup>

<ItemGroup>
  <CompilerVisibleProperty Include="EntitySuffix" />
  <CompilerVisibleProperty Include="EmitCompilerGeneratedFiles" />
</ItemGroup>
```

## 核心功能

### 1. 实体代码生成

#### 基本使用

```csharp
[DtoGenerator]
[Builder]
public partial class UserEntity
{
    private long? _id;
    private string _name;
    private string _email;
}
```

#### 自动生成内容

- **DTO/VO 类** - 数据传输对象和视图对象
- **QueryInput 类** - 查询条件输入对象
- **CrInput/UpInput 类** - 创建和更新输入对象  
- **Builder 模式** - 链式构建器
- **映射方法** - 实体与DTO间自动转换

#### 生成示例

```csharp
// VO 类
[SuppressSniffer, CompilerGenerated]
public partial class UserListOutput
{
    public long? id { get; set; }
    public string? name { get; set; }
    public string? email { get; set; }
}

// QueryInput 类
[SuppressSniffer, CompilerGenerated]
public partial class UserQueryInput : DataQueryInput
{
    public long? id { get; set; }
    public string? name { get; set; }
    
    public Expression<Func<UserEntity, bool>> BuildQueryWhere()
    {
        var where = LinqExtensions.True<UserEntity>();
        where = where.AndIF(this.id != null, x => x.Id == this.id);
        where = where.AndIF(!string.IsNullOrEmpty(this.name), x => x.Name == this.name);
        return where;
    }
}

// Builder 类
public class UserEntityBuilder
{
    private UserEntity _userEntity = new UserEntity();
    
    public UserEntityBuilder SetName(string name)
    {
        _userEntity.Name = name;
        return this;
    }
    
    public UserEntityBuilder SetEmail(string email)
    {
        _userEntity.Email = email;
        return this;
    }
    
    public UserEntity Build()
    {
        return _userEntity;
    }
}
```

### 2. HttpClient API 代码生成

#### 基本使用

```csharp
[HttpClientApi("https://api.example.com", Timeout = 30)]
public interface IUserApi
{
    [Get("users/{id}")]
    Task<UserInfo> GetUserAsync(string id);
    
    [Post("users")]
    Task<UserInfo> CreateUserAsync([Body] CreateUserRequest request);
    
    [Put("users/{id}")]
    Task<UserInfo> UpdateUserAsync(string id, [Body] UpdateUserRequest request);
    
    [Delete("users/{id}")]
    Task DeleteUserAsync(string id);
    
    [Get("users")]
    Task<List<UserInfo>> GetUsersAsync([Query] string? name = null, [Query] int page = 1);
}
```

#### 支持的HTTP方法

- `[Get("path")]` - GET请求
- `[Post("path")]` - POST请求  
- `[Put("path")]` - PUT请求
- `[Delete("path")]` - DELETE请求
- `[Patch("path")]` - PATCH请求
- `[Head("path")]` - HEAD请求
- `[Options("path")]` - OPTIONS请求

#### 参数类型支持

```csharp
[Get("users/{userId}/posts/{postId}")]           // 路径参数
Task<Post> GetPostAsync(string userId, string postId);

[Get("users")]                                     // 查询参数
Task<List<User>> GetUsersAsync([Query] string? name, [Query] int page = 1);

[Post("users")]                                    // 请求体参数
Task<User> CreateUserAsync([Body] CreateUserRequest request);

[Post("users")]                                    // 请求头参数
Task<User> CreateUserAsync([Body] CreateUserRequest request, [Header("Authorization")] string token);

[Get("files/{fileId}")]                           // 文件下载
Task<byte[]> DownloadFileAsync(string fileId);
```

#### Token管理集成

`TokenAttribute` 的 `TokenType` 属性使用字符串类型（`"TenantAccessToken"`、`"UserAccessToken"`、`"AppAccessToken"`），解耦了枚举强绑定。

```csharp
// 定义Token管理器
public interface ITokenManager
{
    Task<string> GetTokenAsync();
}

// 使用Header传递Token
[HttpClientApi(TokenManage = nameof(ITokenManager))]
[Header("Authorization")]
[Token("TenantAccessToken")]
public interface IProtectedApi
{
    [Get("protected/data")]
    Task<Data> GetDataAsync();
}

// 使用 HttpClient 模式（与 TokenManage 互斥，优先）
[HttpClientApi(HttpClient = "IMyHttpClient")]
public interface IHttpClientApi
{
    [Get("protected/data")]
    Task<Data> GetDataAsync();
}
```

> **注意**：`HttpClient` 与 `TokenManage` 属性互斥，同时定义时 `HttpClient` 优先。使用 `HttpClient` 模式时，生成的代码不包含 Token 相关字段和方法，直接注入指定的 HttpClient 接口实例。

#### 按组注册功能

```csharp
[HttpClientApi("https://api.dingtalk.com", RegistryGroupName = "Dingtalk")]
public interface IDingtalkApi
{
    [Get("user/info")]
    Task<UserInfo> GetUserInfoAsync();
}
```

生成独立的注册方法：
```csharp
// 注册钉钉API
services.AddDingtalkWebApiHttpClient();
// 注册微信API  
services.AddWechatWebApiHttpClient();
// 注册未分组的API
services.AddWebApiHttpClient();
```

### 3. 依赖注入代码生成

#### 基本使用

```csharp
[ConstructorInject]  // 字段构造函数注入
[LoggerInject]       // 日志注入
[CacheInject]        // 缓存管理器注入
[UserInject]         // 用户管理器注入
[CustomInject(VarType = "IRepository<SysUser>", VarName = "_userRepository")]  // 自定义注入
public partial class UserService
{
    private readonly IRoleRepository _roleRepository;
    private readonly IPermissionRepository _permissionRepository;
}
```

#### 自动生成内容

```csharp
public partial class UserService
{
    private readonly ILogger<UserService> _logger;
    private readonly ICacheManager _cacheManager;
    private readonly IUserManager _userManager;
    private readonly IRepository<SysUser> _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IPermissionRepository _permissionRepository;

    public UserService(
        ILoggerFactory loggerFactory,
        ICacheManager cacheManager,
        IUserManager userManager,
        IRepository<SysUser> userRepository,
        IRoleRepository roleRepository,
        IPermissionRepository permissionRepository)
    {
        _logger = loggerFactory.CreateLogger<UserService>();
        _cacheManager = cacheManager;
        _userManager = userManager;
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _permissionRepository = permissionRepository;
    }
}
```

#### 支持的注入特性

| 特性 | 功能 | 说明 |
|------|------|------|
| `[ConstructorInject]` | 字段注入 | 扫描私有只读字段生成构造函数参数 |
| `[LoggerInject]` | 日志注入 | 注入 ILogger<T> 日志记录器 |
| `[CacheInject]` | 缓存注入 | 注入 ICacheManager 缓存管理器 |
| `[UserInject]` | 用户注入 | 注入 IUserManager 用户管理器 |
| `[OptionsInject]` | 配置注入 | 根据指定类型注入配置实例 |
| `[CustomInject]` | 自定义注入 | 注入任意类型的依赖项 |

#### 忽略字段注入

```csharp
[ConstructorInject]
public partial class UserService
{
    private readonly IUserRepository _userRepository;
    
    [IgnoreGenerator]
    private readonly string _connectionString = "default_connection_string"; // 不会被注入
}
```

### 4. 高级功能

#### COM对象包装

```csharp
[ComObjectWrap]
[ComCollectionWrap]
public interface IMyComObject
{
    [ComPropertyWrap]
    string Name { get; set; }
    
    [ComPropertyWrap(PropertyType = PropertyType.Method)]
    void DoSomething();
}
```

#### 自动服务注册

```csharp
[AutoRegister]
[AutoRegister(ServiceLifetime.Singleton)]
[AutoRegister(ServiceLifetime.Scoped, InterfaceType = typeof(IMyService))]
public class MyService
{
    // 服务实现
}
```

#### 抽象类支持

```csharp
[HttpClientApi(IsAbstract = true)]
public abstract class BaseApiClient
{
    protected BaseApiClient(HttpClient httpClient, ILogger logger)
    {
        // 基础初始化逻辑
    }
}

[HttpClientApi(InheritedFrom = "BaseApiClient")]
public interface IMyApi : BaseApiClient
{
    [Get("data")]
    Task<Data> GetDataAsync();
}
```

## 配置参数

### 常用配置参数

| 参数名 | 默认值 | 说明 |
|--------|--------|------|
| EmitCompilerGeneratedFiles | false | 是否在obj目录下保存生成的代码 |
| EntitySuffix | Entity | 实体类后缀，用于识别实体类 |
| HttpClientOptionsName | HttpClientOptions | HttpClient配置类名 |
| DefaultLoggerVariable | _logger | 日志变量名默认值 |
| DefaultCacheManagerVariable | _cacheManager | 缓存管理器变量名默认值 |
| DefaultUserManagerVariable | _userManager | 用户管理器变量名默认值 |

### HttpClientApi特性参数

| 参数名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| BaseAddress | string | null | API 基础地址 |
| Timeout | int | 50 | 请求超时时间（秒） |
| ContentType | string | application/json | 默认内容类型 |
| RegistryGroupName | string | null | 注册分组名称 |
| TokenManage | string | null | Token管理器接口名 |
| HttpClient | string | null | HttpClient接口名（与TokenManage互斥，优先） |
| IsAbstract | bool | false | 是否生成抽象类 |
| InheritedFrom | string | null | 继承的基类名 |

## 使用方法

### 1. 实体代码生成

```xml
<!-- 在项目中配置 -->
<PropertyGroup>
  <EmitCompilerGeneratedFiles>true</EmitCompilerGeneratedFiles>
  <EntitySuffix>Entity</EntitySuffix>
  <EntityAttachAttributes>SuppressSniffer</EntityAttachAttributes>
</PropertyGroup>

<!-- 添加特性到实体类 -->
[DtoGenerator]
[Builder]
public partial class UserEntity
{
    // 实体字段定义
}
```

### 2. HttpClient API生成

```xml
<!-- 配置HttpClient选项 -->
<PropertyGroup>
  <HttpClientOptionsName>HttpClientOptions</HttpClientOptionsName>
</PropertyGroup>
```

```csharp
// 添加特性到接口
[HttpClientApi("https://api.example.com")]
public interface IUserApi
{
    // API方法定义
}
```

### 3. 依赖注入生成

```xml
<!-- 配置默认注入类型 -->
<PropertyGroup>
  <DefaultCacheManagerType>ICacheManager</DefaultCacheManagerType>
  <DefaultUserManagerType>IUserManager</DefaultUserManagerType>
</PropertyGroup>
```

```csharp
// 添加特性到类
[ConstructorInject]
[LoggerInject]
[CacheInject]
[UserInject]
public partial class UserService
{
    // 类字段定义
}
```

## 依赖注入配置

```csharp
// 在 Startup.cs 或 Program.cs 中注册服务
public void ConfigureServices(IServiceCollection services)
{
    // 注册Token管理器
    services.AddSingleton<ITokenManager, MyTokenManager>();
    
    // 配置HttpClient选项
    services.Configure<HttpClientOptions>(options =>
    {
        options.BaseUrl = "https://api.example.com";
        options.TimeOut = "30";
        options.EnableLogging = true;
    });
    
    // 注册生成的API客户端
    services.AddHttpClient<IUserApi, UserApi>();
}
```

## 生成代码特性

- ✅ **完整的请求逻辑** - 自动处理请求构建、发送、响应解析
- ✅ **错误处理和日志记录** - 自动记录请求日志和错误信息
- ✅ **异步支持** - 支持async/await模式
- ✅ **类型安全** - 强类型的参数和返回值
- ✅ **配置灵活** - 支持通过特性或配置文件配置
- ✅ **生命周期管理** - 正确处理HttpClient和资源释放
- ✅ **Partial方法** - 生成Partial方法支持自定义扩展
- ✅ **零运行时开销** - 编译时代码生成，性能最优

## 查看生成代码

设置 `EmitCompilerGeneratedFiles=true` 后，生成的代码位于：
```
obj/[Configuration]/[TargetFramework]/generated/
```
文件名以 `.g.cs` 结尾。

## 注意事项

1. 使用 `EmitCompilerGeneratedFiles=true` 可以在 obj 目录下查看生成的代码，便于调试
2. 生成的代码文件名以 `.g.cs` 结尾
3. 所有生成的代码都是 partial 类，不会影响您手动编写的代码
4. 建议在实体类和服务类上使用 partial 关键字，以便代码生成器可以扩展它们

## 项目结构

```text
Mud.CodeGenerator
├── Core/
│   ├── Mud.CodeGenerator                // 代码生成器核心基类库
│   ├── Mud.EntityCodeGenerator          // 实体代码生成器
│   └── Mud.ServiceCodeGenerator         // 服务代码生成器
│       ├── HttpInvoke/                  // HttpClient API 代码生成器
│       ├── ServiceCode/                 // 服务类代码生成器
│       ├── CodeInject/                  // 依赖注入代码生成器
│       └── ComWrap/                     // COM对象包装生成器
├── Test/
│   ├── CodeGeneratorTest                // 代码生成器测试项目
│   └── Mud.Common.CodeGenerator         // 通用代码生成器特性定义
├── mudEntityCodeGenerator.md            // 实体代码生成器详细文档
├── TokenImplementationSummary.md        // Token管理功能实现总结
├── TokenUsageExample.md                 // Token管理功能使用示例
└── README.md
```

## CI/CD

本项目已配置 GitHub Actions 实现自动化编译、测试、打包和发布功能。

### 持续集成

- **触发条件**: 推送到 `master`/`main` 分支或创建 Pull Request
- **执行内容**: 在 .NET 8.0 和 9.0 环境下编译和测试
- **查看状态**: [Actions 页面](../../actions)

### 自动发布

当推送版本标签时自动发布到 NuGet 和 GitHub Releases：

```bash
# 创建并推送版本标签
git tag v1.0.0
git push origin v1.0.0
```

**发布流程:**
1. 编译和测试代码
2. 打包 NuGet 包
3. 发布到 NuGet 官方仓库
4. 创建 GitHub Release
5. 自动生成变更日志

> 📖 详细配置和使用说明请查看 [.github/README.md](.github/README.md)

## 维护者

[倔强的泥巴](https://gitee.com/mudtools)

## 许可证

本项目采用MIT许可证模式：[MIT 许可证](LICENSE)

---

> 💡 **提示**: 生成的代码都是 partial 类，不影响手动编写的代码。建议使用 partial 关键字以便代码生成器扩展。编译时自动生成代码，零运行时开销。