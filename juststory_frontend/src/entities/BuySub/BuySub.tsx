"use client";
import { useEffect, useState } from "react";
import axios from "axios"; // Импортируем Axios
import styles from "./BuySub.module.css"; // Импортируем стили
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { backendApiUrl } from "@/src/utils/backendApiUrl";
import Header from "../Header/Header";

interface Subscription {
  id: number;
  name: string;
  price: number;
  description: string;
}

const BuySub: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<
    number | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true); // Состояние загрузки
  const router = useRouter();

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await axios.get<Subscription[]>(
          `${backendApiUrl}/subscription`
        );
        setSubscriptions(response.data);
      } catch (error) {
        console.error("Ошибка при получении подписок:", error);
      } finally {
        setLoading(false); // Устанавливаем состояние загрузки в false после завершения
      }
    };
    fetchSubscriptions();
  }, []);

  const handleCheckboxChange = (id: number) => {
    setSelectedSubscriptionId(id);
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handlePurchase = async () => {
    const token = Cookies.get("token");
    if (!token || selectedSubscriptionId === null) {
      return alert("Пожалуйста, выберите подписку и войдите в систему.");
    }
    
    const selectedSub = subscriptions.find(sub => sub.id === selectedSubscriptionId);
    if (!selectedSub) {
      return alert("Выбранная подписка не найдена.");
    }
    
    setShowConfirmModal(true);
  };

  const confirmPurchase = async () => {
    const token = Cookies.get("token");
    if (!token || selectedSubscriptionId === null) {
      return;
    }
    
    setShowConfirmModal(false);
    setLoading(true);
    
    try {
      const response = await axios.post(
        `${backendApiUrl}/subscription/purchase/${selectedSubscriptionId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 201) {
        alert("Подписка успешно приобретена!");
        router.push("/profile");
      } else {
        alert("Ошибка при покупке подписки: " + response.data.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Неизвестная ошибка";
      alert("Ошибка при покупке подписки: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Загрузка подписок...</p>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className={styles.container}>
        <h1 className={styles.header}>Выберите подписку</h1>
        <div className={styles.subscriptionList}>
          {subscriptions.map((subscription) => (
            <div key={subscription.id} className={styles.subscriptionItem}>
              <input
                type="checkbox"
                id={`subscription-${subscription.id}`}
                name="subscription"
                value={subscription.id}
                onChange={() => handleCheckboxChange(subscription.id)}
              />
              <label htmlFor={`subscription-${subscription.id}`}>
                <h2>{subscription.name}</h2>
                <p>Цена: {subscription.price} руб.</p>
                <p>Описание: {subscription.description}</p>
              </label>
            </div>
          ))}
        </div>
        <button className={styles.purchaseButton} onClick={handlePurchase} disabled={loading || selectedSubscriptionId === null}>
          {loading ? "Обработка..." : "Купить подписку"}
        </button>
      </div>
      {showConfirmModal && selectedSubscriptionId && (
        <div className={styles.confirmModalOverlay} onClick={() => setShowConfirmModal(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.confirmModalTitle}>Подтверждение покупки</h2>
            <p className={styles.confirmModalText}>
              Вы уверены, что хотите приобрести подписку "{subscriptions.find(s => s.id === selectedSubscriptionId)?.name}" 
              за {subscriptions.find(s => s.id === selectedSubscriptionId)?.price} руб.?
            </p>
            <div className={styles.confirmModalButtons}>
              <button className={styles.confirmButton} onClick={confirmPurchase}>
                Подтвердить
              </button>
              <button className={styles.cancelButton} onClick={() => setShowConfirmModal(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuySub;
