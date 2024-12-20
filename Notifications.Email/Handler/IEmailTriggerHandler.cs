using MONkEY.Notifications.Email.Services;
using MONkEY.Notifications.Email.Triggers;

namespace MONkEY.Notifications.Email.Handler
{
    public interface IEmailTriggerHandler<TEmailTrigger> where TEmailTrigger : EmailTrigger
    {
        Task HandleTrigger(TEmailTrigger trigger, IEmailSenderService emailSender);
    }
}
